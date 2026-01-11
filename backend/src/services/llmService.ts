import Groq from 'groq-sdk';
import { IInterview, IEvaluation } from '../models/Interview';

let groqClient: Groq | null = null;

function getGroqClient(): Groq {
  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });
  }
  return groqClient;
}

/**
 * Evaluates interview performance using Groq LLM.
 * Analyzes transcript, code quality, and problem-solving approach.
 */
export async function evaluateInterview(interview: IInterview): Promise<IEvaluation> {
  const transcriptText = interview.transcript
    .map((t) => `${t.role === 'agent' ? 'Interviewer' : 'Candidate'}: ${t.content}`)
    .join('\n');

  const prompt = `You are an expert technical interviewer evaluator. Analyze the following coding interview and provide detailed feedback.

## Interview Transcript:
${transcriptText || 'No transcript available.'}

## Candidate's Code:
\`\`\`${interview.language}
${interview.code || '// No code submitted'}
\`\`\`

## Questions Asked:
${interview.questions.length > 0 ? interview.questions.map((q, i) => `${i + 1}. ${q}`).join('\n') : 'No specific questions recorded.'}

Please provide a comprehensive evaluation in the following JSON format:
{
  "overallScore": <number from 1-10>,
  "strengths": [<list of things the candidate did well>],
  "improvements": [<list of areas that need improvement>],
  "missingEdgeCases": [<list of edge cases the candidate missed>],
  "nextSteps": [<list of recommended next steps for preparation>],
  "codeReview": "<detailed code review with suggestions>"
}

Be specific, constructive, and encouraging. Focus on actionable feedback.`;

  try {
    const completion = await getGroqClient().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'You are an expert technical interviewer. Respond only with valid JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const responseText = completion.choices[0]?.message?.content || '';
    
    // Extract and parse JSON from LLM response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in LLM response');
    }

    // Sanitize common LLM JSON issues
    const cleanJson = jsonMatch[0]
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')
      .replace(/\n/g, ' ')
      .replace(/\r/g, '')
      .replace(/\t/g, ' ');

    let evaluation: IEvaluation;
    try {
      evaluation = JSON.parse(cleanJson);
    } catch {
      // Aggressive cleanup for stubborn cases
      const aggressiveClean = cleanJson
        .replace(/\\"/g, "'")
        .replace(/\s+/g, ' ')
        .replace(/([{,])\s*(\w+)\s*:/g, '$1"$2":');
      evaluation = JSON.parse(aggressiveClean);
    }

    // Ensure arrays and clamp score
    const ensureArray = (val: unknown): string[] => {
      if (Array.isArray(val)) return val.map(String);
      if (typeof val === 'string') return [val];
      return [];
    };

    return {
      overallScore: Math.min(10, Math.max(1, Number(evaluation.overallScore) || 5)),
      strengths: ensureArray(evaluation.strengths).length > 0 
        ? ensureArray(evaluation.strengths) 
        : ['Good attempt at solving the problem'],
      improvements: ensureArray(evaluation.improvements).length > 0 
        ? ensureArray(evaluation.improvements)
        : ['Consider practicing more problems'],
      missingEdgeCases: ensureArray(evaluation.missingEdgeCases),
      nextSteps: ensureArray(evaluation.nextSteps).length > 0 
        ? ensureArray(evaluation.nextSteps)
        : ['Keep practicing!'],
      codeReview: String(evaluation.codeReview || 'Code submitted for review.'),
    };
  } catch (error) {
    console.error('LLM evaluation error:', error);
    // Fallback evaluation on error
    return {
      overallScore: 5,
      strengths: ['You attempted the problem'],
      improvements: ['Unable to generate detailed feedback'],
      missingEdgeCases: [],
      nextSteps: ['Try again with a new session'],
      codeReview: 'Evaluation could not be completed.',
    };
  }
}

/** Generates a system prompt for the interviewer with a random problem. */
export async function generateInterviewerPrompt(): Promise<string> {
  const problems = [
    { name: 'Two Sum', difficulty: 'Easy', description: 'Find two numbers in an array that add up to a target' },
    { name: 'Reverse String', difficulty: 'Easy', description: 'Reverse a string in-place' },
    { name: 'Valid Parentheses', difficulty: 'Easy', description: 'Check if brackets are balanced and properly nested' },
    { name: 'Palindrome Check', difficulty: 'Easy', description: 'Determine if a string reads the same forwards and backwards' },
    { name: 'FizzBuzz', difficulty: 'Easy', description: 'Print numbers 1-100 with Fizz/Buzz substitutions' },
    { name: 'Merge Two Sorted Arrays', difficulty: 'Easy', description: 'Combine two sorted arrays into one sorted array' },
    { name: 'Find Maximum Subarray', difficulty: 'Medium', description: 'Find the contiguous subarray with the largest sum' },
    { name: 'Binary Search', difficulty: 'Easy', description: 'Implement binary search on a sorted array' },
  ];

  const selected = problems[Math.floor(Math.random() * problems.length)];

  return `You are Sarah, an experienced and friendly technical interviewer.

Present this problem: "${selected.name}" (${selected.difficulty}) - ${selected.description}

Guidelines:
- Be encouraging and supportive
- Ask about time/space complexity and edge cases
- Provide hints if stuck, but never give answers
- Keep responses to 2-3 sentences max
- Let the candidate think out loud

Start by greeting the candidate.`;
}
