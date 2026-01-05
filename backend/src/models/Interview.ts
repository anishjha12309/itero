import mongoose, { Schema, Document } from 'mongoose';

export interface ITranscriptEntry {
  role: 'agent' | 'user';
  content: string;
  timestamp: Date;
}

export interface IEvaluation {
  overallScore: number;
  strengths: string[];
  improvements: string[];
  missingEdgeCases: string[];
  nextSteps: string[];
  codeReview: string;
}

export interface IInterview extends Document {
  sessionId: string;
  status: 'active' | 'completed' | 'evaluated';
  code: string;
  language: string;
  transcript: ITranscriptEntry[];
  questions: string[];
  startedAt: Date;
  endedAt?: Date;
  evaluation?: IEvaluation;
}

const TranscriptEntrySchema = new Schema<ITranscriptEntry>({
  role: { type: String, enum: ['agent', 'user'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const EvaluationSchema = new Schema<IEvaluation>({
  overallScore: { type: Number, required: true, min: 0, max: 10 },
  strengths: [{ type: String }],
  improvements: [{ type: String }],
  missingEdgeCases: [{ type: String }],
  nextSteps: [{ type: String }],
  codeReview: { type: String },
});

const InterviewSchema = new Schema<IInterview>({
  sessionId: { type: String, required: true, unique: true, index: true },
  status: {
    type: String,
    enum: ['active', 'completed', 'evaluated'],
    default: 'active',
  },
  code: { type: String, default: '' },
  language: { type: String, default: 'javascript' },
  transcript: [TranscriptEntrySchema],
  questions: [{ type: String }],
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date },
  evaluation: EvaluationSchema,
});

export const Interview = mongoose.model<IInterview>('Interview', InterviewSchema);
