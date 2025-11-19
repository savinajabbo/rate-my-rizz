import { NextResponse } from 'next/server';
import { generateRandomDateTopic } from '@/lib/openai';

export async function GET() {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key not configured');
      return NextResponse.json(
        { 
          error: 'OpenAI API key not configured. Please set OPENAI_API_KEY in your environment variables.',
          success: false,
          setup_instructions: 'Create a .env.local file with OPENAI_API_KEY=your_api_key_here',
          debug: {
            hasApiKey: false,
            nodeEnv: process.env.NODE_ENV,
            timestamp: new Date().toISOString()
          }
        },
        { status: 500 }
      );
    }
    const topic = await generateRandomDateTopic();
    const processingTime = Date.now() - startTime;
    
    
    return NextResponse.json({ 
      topic,
      success: true,
      processingTime,
      timestamp: new Date().toISOString(),
      source: 'openai'
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error('Error generating random topic:', {
      error: error.message,
      stack: error.stack,
      processingTime
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to generate topic with OpenAI API',
        details: error.message,
        success: false,
        processingTime,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

