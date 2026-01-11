import { v4 as uuidv4 } from 'uuid';
import { Interview, IInterview } from '../models/Interview';
import { createLiveKitRoom } from './livekitService';
import { evaluateInterview } from './llmService';
import { redis } from '../config/redis';

interface StartInterviewResult {
  sessionId: string;
  livekitToken: string;
  livekitUrl: string;
  roomName: string;
}

/**
 * Creates a new interview session with LiveKit room and MongoDB record.
 * Returns credentials for the frontend to join the voice room.
 */
export async function startNewInterview(): Promise<StartInterviewResult> {
  const sessionId = uuidv4();

  // Create LiveKit room - this is where the AI agent will join
  const livekit = await createLiveKitRoom(sessionId);

  // Persist interview record
  const interview = new Interview({
    sessionId,
    status: 'active',
    code: '',
    language: 'javascript',
    transcript: [],
    questions: [],
    startedAt: new Date(),
  });
  await interview.save();

  // Cache room name for quick lookup (2hr TTL matches session max)
  try {
    await redis.set(`interview:${sessionId}:room`, livekit.roomName, 'EX', 7200);
  } catch {
    // Redis is optional - continue without caching
  }

  return {
    sessionId,
    livekitToken: livekit.token,
    livekitUrl: livekit.url,
    roomName: livekit.roomName,
  };
}

/** Updates the candidate's code during an active session. */
export async function updateInterviewCode(sessionId: string, code: string): Promise<void> {
  await Interview.findOneAndUpdate({ sessionId }, { code }, { new: true });
}

/**
 * Ends the interview, triggers LLM evaluation, and returns results.
 * Extracts questions from transcript for evaluation context.
 */
export async function endInterviewSession(
  sessionId: string,
  code: string,
  transcript: Array<{ role: string; content: string; timestamp: Date }>
): Promise<IInterview | null> {
  // Extract agent questions for evaluation context
  const questions = transcript
    .filter((t) => t.role === 'agent' && t.content.includes('?'))
    .map((t) => t.content)
    .slice(0, 5);

  const interview = await Interview.findOneAndUpdate(
    { sessionId },
    {
      status: 'completed',
      code,
      transcript: transcript.map((t) => ({
        role: t.role === 'agent' ? 'agent' : 'user',
        content: t.content,
        timestamp: t.timestamp,
      })),
      questions,
      endedAt: new Date(),
    },
    { new: true }
  );

  // Cleanup Redis cache
  try {
    await redis.del(`interview:${sessionId}:room`);
  } catch {
    // Non-critical
  }

  // Async evaluation - don't block the response
  if (interview) {
    try {
      const evaluation = await evaluateInterview(interview);
      interview.evaluation = evaluation;
      interview.status = 'evaluated';
      await interview.save();
    } catch (error) {
      console.error('Evaluation failed:', error);
      // Interview saved, evaluation can be retried
    }
  }

  return interview;
}

export async function getInterviewById(sessionId: string): Promise<IInterview | null> {
  return Interview.findOne({ sessionId });
}
