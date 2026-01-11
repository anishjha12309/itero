import { AccessToken } from 'livekit-server-sdk';

interface LiveKitRoomCredentials {
  token: string;
  url: string;
  roomName: string;
}

/**
 * Creates a LiveKit room and generates an access token for the candidate.
 * Room naming convention: interview-{sessionId} for easy debugging.
 */
export async function createLiveKitRoom(sessionId: string): Promise<LiveKitRoomCredentials> {
  const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || '';
  const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || '';
  const LIVEKIT_URL = process.env.LIVEKIT_URL || '';

  const roomName = `interview-${sessionId}`;
  const participantIdentity = `candidate-${sessionId.slice(0, 8)}`;

  // Token grants: publish audio, subscribe to agent, send code via data channel
  const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: participantIdentity,
    ttl: '2h',
  });

  token.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  return {
    token: await token.toJwt(),
    url: LIVEKIT_URL,
    roomName,
  };
}

/** Validates LiveKit environment configuration. */
export function isLiveKitConfigured(): boolean {
  return Boolean(
    process.env.LIVEKIT_API_KEY &&
    process.env.LIVEKIT_API_SECRET &&
    process.env.LIVEKIT_URL
  );
}
