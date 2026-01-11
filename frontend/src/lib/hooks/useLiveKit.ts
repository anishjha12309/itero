'use client';

/**
 * LiveKit Room Hook
 * Manages WebRTC voice connection, transcriptions, and code sharing with the AI agent.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { Room, RoomEvent, Track } from 'livekit-client';
import { TranscriptEntry } from '@/types';

interface UseLiveKitOptions {
  onTranscriptUpdate?: (entry: TranscriptEntry) => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onCallEnd?: () => void;
  onError?: (error: Error) => void;
}

interface LiveKitConnectionParams {
  token: string;
  url: string;
  roomName: string;
}

export function useLiveKit(options: UseLiveKitOptions = {}) {
  const roomRef = useRef<Room | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const connectionParamsRef = useRef<LiveKitConnectionParams | null>(null);
  
  // Dedup transcripts by ID + content prefix
  const processedTranscripts = useRef<Set<string>>(new Set());

  const startCall = useCallback(async (params: LiveKitConnectionParams) => {
    if (roomRef.current) return;

    connectionParamsRef.current = params;
    const room = new Room({ adaptiveStream: true, dynacast: true });
    roomRef.current = room;

    // Connection lifecycle
    room.on(RoomEvent.Connected, () => {
      setIsConnected(true);
      setIsListening(true);
    });

    room.on(RoomEvent.Disconnected, () => {
      setIsConnected(false);
      setIsListening(false);
      setIsSpeaking(false);
      options.onCallEnd?.();
    });

    // Attach agent audio to DOM for playback
    room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      if (track.kind === Track.Kind.Audio && participant.identity.includes('agent')) {
        const audioElement = track.attach();
        audioElement.id = 'agent-audio';
        document.body.appendChild(audioElement);
      }
    });

    room.on(RoomEvent.TrackUnsubscribed, (track) => {
      if (track.kind === Track.Kind.Audio) {
        track.detach().forEach(el => el.remove());
      }
    });

    // Agent speaking state via active speaker detection
    room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
      const agentSpeaking = speakers.some(s => s.identity.includes('agent'));
      if (agentSpeaking && !isSpeaking) {
        setIsSpeaking(true);
        setIsListening(false);
        options.onSpeechStart?.();
      } else if (!agentSpeaking && isSpeaking) {
        setIsSpeaking(false);
        setIsListening(true);
        options.onSpeechEnd?.();
      }
    });

    // Process transcriptions with deduplication
    room.on(RoomEvent.TranscriptionReceived, (segments, participant) => {
      for (const segment of segments) {
        if (!segment.final) continue;
        
        const text = segment.text?.trim() || '';
        if (!text) continue;

        const baseKey = `${participant?.identity || 'unknown'}-${segment.id}`;
        if (processedTranscripts.current.has(baseKey)) continue;

        // Similarity check to prevent near-duplicates
        const recentTexts = Array.from(processedTranscripts.current);
        const isDuplicate = recentTexts.some(key => {
          const parts = key.split('::');
          if (parts.length < 2) return false;
          const existingText = parts[1];
          if (existingText && text.length > 5) {
            const similarity = text.toLowerCase().includes(existingText.toLowerCase().slice(0, 20)) ||
                              existingText.toLowerCase().includes(text.toLowerCase().slice(0, 20));
            return similarity && Math.abs(existingText.length - text.length) < 10;
          }
          return existingText === text;
        });

        if (isDuplicate) continue;

        const fullKey = `${baseKey}::${text.slice(0, 30)}`;
        processedTranscripts.current.add(fullKey);

        // Bound cache size
        if (processedTranscripts.current.size > 200) {
          const firstKey = processedTranscripts.current.values().next().value;
          if (firstKey) processedTranscripts.current.delete(firstKey);
        }

        const isAgent = participant?.identity?.includes('agent') ?? false;
        options.onTranscriptUpdate?.({
          id: segment.id || crypto.randomUUID(),
          role: isAgent ? 'agent' : 'user',
          content: text,
          timestamp: new Date(),
        });
      }
    });

    // Data channel fallback for custom transcriptions
    room.on(RoomEvent.DataReceived, (payload) => {
      try {
        const data = JSON.parse(new TextDecoder().decode(payload));
        if (data.type === 'transcription') {
          const key = `custom-${data.timestamp}-${data.text}`;
          if (processedTranscripts.current.has(key)) return;
          processedTranscripts.current.add(key);

          if (data.text?.trim()) {
            options.onTranscriptUpdate?.({
              id: crypto.randomUUID(),
              role: data.role === 'assistant' ? 'agent' : 'user',
              content: data.text,
              timestamp: new Date(),
            });
          }
        }
      } catch {
        // Non-JSON message, ignore
      }
    });

    try {
      await room.connect(params.url, params.token);
      await room.localParticipant.setMicrophoneEnabled(true);
    } catch (error) {
      options.onError?.(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }, [options, isSpeaking]);

  const endCall = useCallback(() => {
    roomRef.current?.disconnect();
    roomRef.current = null;
  }, []);

  const toggleMute = useCallback(async () => {
    if (roomRef.current) {
      const newMutedState = !isMuted;
      await roomRef.current.localParticipant.setMicrophoneEnabled(!newMutedState);
      setIsMuted(newMutedState);
    }
  }, [isMuted]);

  /** Sends code to agent via reliable data channel. */
  const sendCode = useCallback((code: string, language: string = 'javascript') => {
    if (roomRef.current && isConnected) {
      const payload = JSON.stringify({
        type: 'code_update',
        code,
        language,
        timestamp: Date.now(),
      });
      roomRef.current.localParticipant.publishData(
        new TextEncoder().encode(payload),
        { reliable: true }
      );
    }
  }, [isConnected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      roomRef.current?.disconnect();
      roomRef.current = null;
    };
  }, []);

  return {
    isConnected,
    isMuted,
    isSpeaking,
    isListening,
    startCall,
    endCall,
    toggleMute,
    sendCode,
  };
}
