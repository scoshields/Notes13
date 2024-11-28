import { Handler } from '@netlify/functions';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OpenAI API key missing');
      throw new Error('OpenAI API key is not configured');
    }

    if (!event.body) {
      throw new Error('Request body is empty');
    }

    let body;
    try {
      body = JSON.parse(event.body);
    } catch (e) {
      console.error('JSON Parse Error:', e);
      throw new Error('Invalid JSON in request body');
    }

    const { content, prompt } = body;

    if (!content || typeof content !== 'string') {
      throw new Error('Content is required and must be a string');
    }

    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Prompt is required and must be a string');
    }

    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: prompt
        },
        {
          role: "user",
          content: content
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const processedContent = completion.choices[0]?.message?.content;

    if (!processedContent) {
      throw new Error('No response from OpenAI');
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        processedContent
      })
    };
  } catch (error) {
    console.error('Error in process-note function:', error);
    
    let statusCode = 500;
    let errorMessage = 'An unexpected error occurred';
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        errorMessage = 'API configuration error';
      } else if (error.message.includes('JSON')) {
        statusCode = 400;
        errorMessage = 'Invalid request format';
      } else if (error.message.includes('Content is required') || 
                 error.message.includes('Prompt is required')) {
        statusCode = 400;
        errorMessage = error.message;
      } else {
        errorMessage = error.message;
      }
    }
    
    return {
      statusCode,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: errorMessage
      })
    };
  }
};