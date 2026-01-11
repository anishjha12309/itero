/**
 * API client for Itero backend.
 * All interview lifecycle operations are managed here.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/** Creates a new interview session and returns LiveKit credentials. */
export async function startInterview() {
  const res = await fetch(`${API_URL}/api/interview/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to start interview');
  return res.json();
}

/** Ends the interview and triggers LLM evaluation. */
export async function endInterview(sessionId: string, code: string, transcript: any[]) {
  const res = await fetch(`${API_URL}/api/interview/${sessionId}/end`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, transcript }),
  });
  if (!res.ok) throw new Error('Failed to end interview');
  return res.json();
}

/** Persists code updates during an active session. */
export async function updateCode(sessionId: string, code: string) {
  const res = await fetch(`${API_URL}/api/interview/${sessionId}/code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  if (!res.ok) throw new Error('Failed to update code');
  return res.json();
}

export async function getInterview(sessionId: string) {
  const res = await fetch(`${API_URL}/api/interview/${sessionId}`);
  if (!res.ok) throw new Error('Failed to get interview');
  return res.json();
}

export async function getResults(sessionId: string) {
  const res = await fetch(`${API_URL}/api/results/${sessionId}`);
  if (!res.ok) throw new Error('Failed to get results');
  return res.json();
}
