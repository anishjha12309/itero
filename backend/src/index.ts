/**
 * Itero Backend Server
 * Express API handling interview lifecycle, LiveKit coordination, and LLM evaluation.
 */
import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import interviewRoutes from './routes/interview';
import evaluateRoutes from './routes/evaluate';

const app = express();
const PORT = process.env.PORT || 5000;

// CORS: Allow frontend origins (localhost + production)
const allowedOrigins = [
  'http://localhost:3000',
  'https://itero-olive.vercel.app',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const cleanOrigin = origin.replace(/\/$/, '');
    const isAllowed = allowedOrigins.some(allowed => 
      allowed && cleanOrigin === allowed.replace(/\/$/, '')
    );
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, true); // Log but allow for debugging
    }
  },
  credentials: true,
}));
app.use(express.json());

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check for uptime monitoring
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Route mounting
app.use('/api/interview', interviewRoutes);
app.use('/api/evaluate', evaluateRoutes);
app.use('/api/results', evaluateRoutes);

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

async function startServer() {
  try {
    await connectDatabase();
    await connectRedis();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📝 API endpoints:`);
      console.log(`   POST /api/interview/start`);
      console.log(`   POST /api/interview/:id/code`);
      console.log(`   POST /api/interview/:id/end`);
      console.log(`   GET  /api/interview/:id`);
      console.log(`   POST /api/evaluate/:id`);
      console.log(`   GET  /api/results/:id`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
