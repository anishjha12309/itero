import Groq from 'groq-sdk';
import { IInterview, IEvaluation } from '../models/Interview';

let groqClient: Groq | null = null;

function getGroqClient(): Groq {
  if (!groqClient) {
    groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY || '',
    });
  }
  return groqClient;
}

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
    console.log('Calling Groq API for evaluation...');
    console.log('Interview data - Code length:', interview.code?.length || 0);
    console.log('Interview data - Transcript entries:', interview.transcript?.length || 0);
    
    const completion = await getGroqClient().chat.completions.create({
      model: 'llama-3.3-70b-versatile', // Currently available model
      messages: [
        {
          role: 'system',
          content: 'You are an expert technical interviewer. Respond only with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const responseText = completion.choices[0]?.message?.content || '';
    console.log('Groq evaluation response received, length:', responseText.length);
    console.log('Groq raw response:', responseText.substring(0, 500)); // Log first 500 chars
    
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Failed to parse evaluation response - no JSON found');
      console.error('Full response:', responseText);
      throw new Error('Failed to parse evaluation response');
    }

    console.log('JSON extracted, parsing...');
    
    // Sanitize JSON: Remove control characters that break parsing
    const cleanJson = jsonMatch[0]
      .replace(/[\x00-\x1F\x7F]/g, ' ') // Replace control chars with space
      .replace(/\n/g, ' ')              // Replace newlines
      .replace(/\r/g, ' ')              // Replace carriage returns
      .replace(/\t/g, ' ')              // Replace tabs
      .replace(/\s+/g, ' ');            // Collapse multiple spaces
    
    const evaluation: IEvaluation = JSON.parse(cleanJson);
    console.log('Evaluation parsed successfully, score:', evaluation.overallScore);
    
    // Validate and sanitize the evaluation
    return {
      overallScore: Math.min(10, Math.max(1, evaluation.overallScore || 5)),
      strengths: evaluation.strengths || ['Good attempt at solving the problem'],
      improvements: evaluation.improvements || ['Consider practicing more problems'],
      missingEdgeCases: evaluation.missingEdgeCases || [],
      nextSteps: evaluation.nextSteps || ['Keep practicing!'],
      codeReview: evaluation.codeReview || 'Code submitted for review.',
    };
  } catch (error) {
    console.error('=== LLM EVALUATION ERROR ===');
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    // Return default evaluation on error
    return {
      overallScore: 5,
      strengths: ['You attempted the problem'],
      improvements: ['Unable to generate detailed feedback due to an error'],
      missingEdgeCases: [],
      nextSteps: ['Try again with a new interview session'],
      codeReview: 'Evaluation could not be completed.',
    };
  }
}

export async function generateInterviewerPrompt(): Promise<string> {
  // Expanded problem pool with varying difficulty
  const problems = [
    { name: 'Two Sum', difficulty: 'Easy', description: 'Find two numbers in an array that add up to a target' },
    { name: 'Reverse String', difficulty: 'Easy', description: 'Reverse a string in-place' },
    { name: 'Valid Parentheses', difficulty: 'Easy', description: 'Check if brackets are balanced and properly nested' },
    { name: 'Palindrome Check', difficulty: 'Easy', description: 'Determine if a string reads the same forwards and backwards' },
    { name: 'FizzBuzz', difficulty: 'Easy', description: 'Print numbers 1-100 with Fizz/Buzz/FizzBuzz substitutions' },
    { name: 'Merge Two Sorted Arrays', difficulty: 'Easy', description: 'Combine two sorted arrays into one sorted array' },
    { name: 'Find Maximum Subarray', difficulty: 'Medium', description: 'Find the contiguous subarray with the largest sum (Kadane\'s algorithm)' },
    { name: 'Binary Search', difficulty: 'Easy', description: 'Implement binary search on a sorted array' },
    { name: 'Remove Duplicates from Sorted Array', difficulty: 'Easy', description: 'Remove duplicates in-place from a sorted array' },
    { name: 'Linked List Cycle Detection', difficulty: 'Medium', description: 'Detect if a linked list has a cycle using Floyd\'s algorithm' },
  ];

  // Randomly select a problem
  const selectedProblem = problems[Math.floor(Math.random() * problems.length)];

  return `You are Sarah, an experienced and friendly technical interviewer conducting a coding interview. Your goal is to help the candidate demonstrate their problem-solving skills.

Your responsibilities:
1. Start by introducing yourself briefly and explaining the interview format
2. Present this specific coding problem: "${selectedProblem.name}" (${selectedProblem.difficulty}) - ${selectedProblem.description}
3. Let the candidate think and ask clarifying questions
4. Encourage them to think out loud
5. Ask follow-up questions about:
   - Time and space complexity
   - Edge cases they're considering
   - Alternative approaches
6. Provide hints if they're stuck (but don't give away the answer)
7. Be encouraging and supportive
8. When done, thank them and let them know the interview is complete

Remember:
- Keep responses conversational and natural
- Don't overwhelm with too many questions at once
- Acknowledge good thinking and solutions
- Be patient and give them time to think
- Keep your responses concise (2-3 sentences max)

Start by greeting the candidate.`;
}
