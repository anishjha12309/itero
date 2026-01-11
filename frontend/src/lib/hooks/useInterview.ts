'use client';

/**
 * Interview Session Hook
 * Manages interview lifecycle state: session ID, code, transcript, and LiveKit credentials.
 */

import { useState, useCallback } from 'react';
import { TranscriptEntry } from '@/types';
import { startInterview as apiStartInterview, endInterview as apiEndInterview, updateCode } from '@/lib/api';

interface LiveKitCredentials {
  livekitToken: string;
  livekitUrl: string;
  roomName: string;
}

export function useInterview() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [livekitCredentials, setLivekitCredentials] = useState<LiveKitCredentials | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [code, setCode] = useState('// Write your solution here\n\nfunction solution() {\n  \n}\n');
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  /** Initializes a new interview session and retrieves LiveKit credentials. */
  const startInterview = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiStartInterview();
      setSessionId(response.sessionId);
      setLivekitCredentials({
        livekitToken: response.livekitToken,
        livekitUrl: response.livekitUrl,
        roomName: response.roomName,
      });
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start interview';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** Ends the session and triggers evaluation. */
  const endInterviewSession = useCallback(async () => {
    if (!sessionId) return;
    setIsLoading(true);
    try {
      await apiEndInterview(sessionId, code, transcript);
    } catch (err) {
      console.error('Failed to end interview:', err);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, code, transcript]);

  /** Updates code locally and persists to backend. */
  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
    if (sessionId) {
      updateCode(sessionId, newCode).catch(console.error);
    }
  }, [sessionId]);

  const addTranscript = useCallback((entry: TranscriptEntry) => {
    setTranscript((prev) => [...prev, entry]);
  }, []);

  const resetInterview = useCallback(() => {
    setSessionId(null);
    setLivekitCredentials(null);
    setCode('// Write your solution here\n\nfunction solution() {\n  \n}\n');
    setTranscript([]);
    setError(null);
  }, []);

  return {
    sessionId,
    livekitCredentials,
    isLoading,
    code,
    transcript,
    error,
    startInterview,
    endInterviewSession,
    handleCodeChange,
    addTranscript,
    resetInterview,
  };
}
