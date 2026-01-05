export interface TranscriptEntry {
  id: string;
  role: 'agent' | 'user';
  content: string;
  timestamp: Date;
}
