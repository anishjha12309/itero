'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import Vapi from '@vapi-ai/web';
import { TranscriptEntry } from '@/types';

// IMPORTANT: This key helps identify your browser session to Vapi
const VAPI_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || '';

interface UseVapiOptions {
  onTranscriptUpdate?: (entry: TranscriptEntry) => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onCallEnd?: () => void;
  onError?: (error: Error) => void;
}

export function useVapi(options: UseVapiOptions = {}) {
  const vapiRef = useRef<Vapi | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    if (!vapiRef.current && VAPI_PUBLIC_KEY) {
      vapiRef.current = new Vapi(VAPI_PUBLIC_KEY);

      vapiRef.current.on('call-start', () => {
        setIsConnected(true);
        setIsListening(true);
      });

      vapiRef.current.on('call-end', () => {
        setIsConnected(false);
        setIsListening(false);
        setIsSpeaking(false);
        options.onCallEnd?.();
      });

      vapiRef.current.on('speech-start', () => {
        setIsSpeaking(true);
        setIsListening(false);
        options.onSpeechStart?.();
      });

      vapiRef.current.on('speech-end', () => {
        setIsSpeaking(false);
        setIsListening(true);
        options.onSpeechEnd?.();
      });

      vapiRef.current.on('message', (message) => {
        if (message.type === 'transcript' && message.transcriptType === 'final') {
          const entry: TranscriptEntry = {
            id: crypto.randomUUID(),
            role: message.role === 'assistant' ? 'agent' : 'user',
            content: message.transcript || '',
            timestamp: new Date(),
          };
          options.onTranscriptUpdate?.(entry);
        }
      });

      vapiRef.current.on('error', (error) => {
        console.error('Vapi error:', error);
        options.onError?.(new Error(String(error)));
      });
    }

    return () => {
      // Cleanup if needed
    };
  }, []);

  const startCall = useCallback(async (assistantId: string) => {
    if (vapiRef.current) {
      try {
        await vapiRef.current.start(assistantId);
      } catch (error) {
        console.error('Failed to start Vapi call:', error);
        throw error;
      }
    }
  }, []);

  const endCall = useCallback(() => {
    if (vapiRef.current) {
      vapiRef.current.stop();
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (vapiRef.current) {
      const newMutedState = !isMuted;
      vapiRef.current.setMuted(newMutedState);
      setIsMuted(newMutedState);
    }
  }, [isMuted]);

  // Send a message for the agent to speak aloud
  const say = useCallback((message: string) => {
    if (vapiRef.current && isConnected) {
      vapiRef.current.send({
        type: 'add-message',
        message: {
          role: 'system',
          content: message,
        },
      });
    }
  }, [isConnected]);

  return {
    isConnected,
    isMuted,
    isSpeaking,
    isListening,
    startCall,
    endCall,
    toggleMute,
    say,
  };
}
