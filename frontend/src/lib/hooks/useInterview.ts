'use client';

import { useState, useCallback } from 'react';
import { TranscriptEntry } from '@/types';
import { startInterview as apiStartInterview, endInterview as apiEndInterview, updateCode } from '@/lib/api';

export function useInterview() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [assistantId, setAssistantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [code, setCode] = useState('// Write your solution here\n\nfunction solution() {\n  \n}\n');
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const startInterview = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiStartInterview();
      setSessionId(response.sessionId);
      setAssistantId(response.assistantId);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start interview';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
    // Debounce code updates to backend
    if (sessionId) {
      updateCode(sessionId, newCode).catch(console.error);
    }
  }, [sessionId]);

  const addTranscript = useCallback((entry: TranscriptEntry) => {
    setTranscript((prev) => [...prev, entry]);
  }, []);

  const resetInterview = useCallback(() => {
    setSessionId(null);
    setAssistantId(null);
    setCode('// Write your solution here\n\nfunction solution() {\n  \n}\n');
    setTranscript([]);
    setError(null);
  }, []);

  return {
    sessionId,
    assistantId,
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
