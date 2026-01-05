import { v4 as uuidv4 } from 'uuid';
import { Interview, IInterview } from '../models/Interview';
import { createVapiAssistant, deleteVapiAssistant } from './vapiService';
import { evaluateInterview } from './llmService';

import { redis } from '../config/redis';

interface StartInterviewResult {
  sessionId: string;
  assistantId: string;
}

export async function startNewInterview(): Promise<StartInterviewResult> {
  console.log('startNewInterview: Starting...');
  const sessionId = uuidv4();
  console.log('startNewInterview: Session ID:', sessionId);

  // Create Vapi assistant for this session
  console.log('startNewInterview: Creating Vapi assistant...');
  let assistant;
  try {
    assistant = await createVapiAssistant(sessionId);
    console.log('startNewInterview: Vapi assistant created:', assistant.id);
  } catch (error) {
    console.error('startNewInterview: Vapi error:', error);
    throw error;
  }

  // Create interview record in database
  console.log('startNewInterview: Creating interview record...');
  try {
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
    console.log('startNewInterview: Interview saved to MongoDB');
  } catch (error) {
    console.error('startNewInterview: MongoDB error:', error);
    throw error;
  }

  // Store assistant ID in Redis for quick lookup
  try {
    await redis.set(`interview:${sessionId}:assistant`, assistant.id, 'EX', 7200);
    console.log('startNewInterview: Assistant ID stored in Redis');
  } catch (error) {
    console.error('startNewInterview: Redis error:', error);
    // Don't throw - Redis is optional
  }

  console.log('startNewInterview: Success!');
  return {
    sessionId,
    assistantId: assistant.id,
  };
}

export async function updateInterviewCode(sessionId: string, code: string): Promise<void> {
  await Interview.findOneAndUpdate(
    { sessionId },
    { code },
    { new: true }
  );
}

export async function endInterviewSession(
  sessionId: string,
  code: string,
  transcript: Array<{ role: string; content: string; timestamp: Date }>
): Promise<IInterview | null> {
  // Extract questions from the transcript (agent messages that contain question marks)
  const questions = transcript
    .filter((t) => t.role === 'agent' && t.content.includes('?'))
    .map((t) => t.content)
    .slice(0, 5); // Limit to first 5 questions

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

  // Clean up Vapi assistant
  try {
    const assistantId = await redis.get(`interview:${sessionId}:assistant`);
    if (assistantId) {
      await deleteVapiAssistant(assistantId);
      await redis.del(`interview:${sessionId}:assistant`);
    }
  } catch (error) {
    console.error('Error cleaning up Vapi assistant:', error);
  }

  // Trigger LLM evaluation
  if (interview) {
    try {
      console.log('Triggering LLM evaluation for session:', sessionId);
      const evaluation = await evaluateInterview(interview);
      interview.evaluation = evaluation;
      interview.status = 'evaluated';
      await interview.save();
      console.log('Evaluation complete for session:', sessionId);
    } catch (error) {
      console.error('Failed to evaluate interview:', error);
      // Continue - interview is still saved, evaluation can be retried
    }
  }

  return interview;
}

export async function getInterviewById(sessionId: string): Promise<IInterview | null> {
  return Interview.findOne({ sessionId });
}
