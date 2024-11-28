import { ProcessingOptions } from '../types';

const API_URL = '/.netlify/functions/process-note';

export async function processNoteWithAPI({ content, prompt }: ProcessingOptions) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content, prompt }),
    });

    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      throw new Error('Failed to parse server response');
    }

    if (!response.ok) {
      const errorMessage = data?.error || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }

    if (!data?.processedContent) {
      throw new Error('Invalid response format: missing processedContent');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Failed to process note. Please try again.';
    
    throw new Error(errorMessage);
  }
}