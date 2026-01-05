import { Router, Request, Response } from 'express';
import {
  startNewInterview,
  updateInterviewCode,
  endInterviewSession,
  getInterviewById,
} from '../services/interviewService';

const router = Router();

// POST /api/interview/start - Start a new interview session
router.post('/start', async (req: Request, res: Response) => {
  try {
    const result = await startNewInterview();
    res.json(result);
  } catch (error) {
    console.error('Error starting interview:', error);
    const errMsg = error instanceof Error ? error.message : String(error);
    const errStack = error instanceof Error ? error.stack : undefined;
    res.status(500).json({ 
      error: 'Failed to start interview',
      details: errMsg,
      stack: errStack
    });
  }
});

// POST /api/interview/:id/code - Update code during interview
router.post('/:id/code', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { code } = req.body;

    await updateInterviewCode(id, code);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating code:', error);
    res.status(500).json({ error: 'Failed to update code' });
  }
});

// POST /api/interview/:id/end - End interview session
router.post('/:id/end', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { code, transcript } = req.body;

    const interview = await endInterviewSession(id, code, transcript);
    
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    res.json({ success: true, sessionId: interview.sessionId });
  } catch (error) {
    console.error('Error ending interview:', error);
    res.status(500).json({ error: 'Failed to end interview' });
  }
});

// GET /api/interview/:id - Get interview by session ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const interview = await getInterviewById(id);

    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    res.json(interview);
  } catch (error) {
    console.error('Error getting interview:', error);
    res.status(500).json({ error: 'Failed to get interview' });
  }
});

export default router;
