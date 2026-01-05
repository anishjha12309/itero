import { v4 as uuidv4 } from 'uuid';
import { generateInterviewerPrompt } from './llmService';

interface VapiAssistant {
  id: string;
  name: string;
}

export async function createVapiAssistant(sessionId: string): Promise<VapiAssistant> {
  const VAPI_API_KEY = process.env.VAPI_API_KEY || '';
  
  const assistantName = `Interview-${sessionId.slice(0, 8)}`;
  
  // Use mock mode if no API key
  if (!VAPI_API_KEY) {
    console.log('Using mock Vapi assistant (no API key configured)');
    return {
      id: `mock-${uuidv4()}`,
      name: assistantName,
    };
  }
  
  const systemPrompt = await generateInterviewerPrompt();

  // Vapi assistant config with supported models
  const assistantConfig = {
    name: assistantName,
    model: {
      provider: 'openai',
      model: 'gpt-3.5-turbo', // Use stable model
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
      ],
      temperature: 0.7,
    },
    voice: {
      provider: '11labs',
      voiceId: 'EXAVITQu4vr4xnSDxMaL', // Sarah - clear female voice
    },
    transcriber: {
      provider: 'deepgram',
      model: 'nova-2',
      language: 'en',
    },
    firstMessage: "Hello! I'm Sarah, your AI interviewer today. Welcome to your coding interview practice. I'll give you a problem to solve, and I'd like you to explain your thinking as you work through it. Ready to start?",
    silenceTimeoutSeconds: 30,
    maxDurationSeconds: 1800,
  };

  try {
    console.log('Creating Vapi assistant with gpt-3.5-turbo...');
    
    const response = await fetch('https://api.vapi.ai/assistant', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(assistantConfig),
    });

    const responseText = await response.text();
    console.log('Vapi response status:', response.status);
    
    if (!response.ok) {
      console.error('Vapi API error:', responseText);
      
      // Fallback to mock on API errors
      console.log('Falling back to mock assistant');
      return {
        id: `mock-${uuidv4()}`,
        name: assistantName,
      };
    }

    const assistant = JSON.parse(responseText) as { id: string; name: string };
    console.log('Vapi assistant created successfully:', assistant.id);
    
    return {
      id: assistant.id,
      name: assistant.name,
    };
  } catch (error) {
    console.error('Error creating Vapi assistant:', error);
    
    // Fallback to mock on network errors
    console.log('Falling back to mock assistant due to error');
    return {
      id: `mock-${uuidv4()}`,
      name: assistantName,
    };
  }
}

export async function deleteVapiAssistant(assistantId: string): Promise<void> {
  if (assistantId.startsWith('mock-')) {
    return;
  }
  
  const VAPI_API_KEY = process.env.VAPI_API_KEY || '';
  
  try {
    const response = await fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
      },
    });

    if (!response.ok) {
      console.error('Failed to delete Vapi assistant:', response.status);
    }
  } catch (error) {
    console.error('Error deleting Vapi assistant:', error);
  }
}
