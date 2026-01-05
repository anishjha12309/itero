import { Router, Request, Response } from 'express';
import { Interview } from '../models/Interview';
import { evaluateInterview } from '../services/llmService';

const router = Router();

// POST /api/evaluate/:id - Evaluate an interview
router.post('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const interview = await Interview.findOne({ sessionId: id });
    
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    if (interview.status === 'evaluated') {
      return res.json({ 
        success: true, 
        message: 'Interview already evaluated',
        evaluation: interview.evaluation 
      });
    }

    // Perform LLM evaluation
    const evaluation = await evaluateInterview(interview);

    // Update interview with evaluation
    interview.evaluation = evaluation;
    interview.status = 'evaluated';
    await interview.save();

    res.json({ success: true, evaluation });
  } catch (error) {
    console.error('Error evaluating interview:', error);
    res.status(500).json({ error: 'Failed to evaluate interview' });
  }
});

// GET /api/results/:id - Get results for an interview
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const interview = await Interview.findOne({ sessionId: id });
    
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    res.json({
      sessionId: interview.sessionId,
      status: interview.status,
      code: interview.code,
      questions: interview.questions,
      transcript: interview.transcript,
      evaluation: interview.evaluation || null,
      startedAt: interview.startedAt,
      endedAt: interview.endedAt,
    });
  } catch (error) {
    console.error('Error getting results:', error);
    res.status(500).json({ error: 'Failed to get results' });
  }
});

export default router;
