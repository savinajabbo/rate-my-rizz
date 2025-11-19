import { NextResponse } from 'next/server';
import { generateRandomDateTopic } from '@/lib/openai';

export async function GET(request: Request) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  const url = new URL(request.url);
  const timestamp = url.searchParams.get('t');
  
  console.log(`API called with requestId: ${requestId}, timestamp: ${timestamp}`);
  
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
    
    console.log(`Calling generateRandomDateTopic for request ${requestId}`);
    const topic = await generateRandomDateTopic();
    console.log(`Generated topic for request ${requestId}: ${topic}`);
    
    const processingTime = Date.now() - startTime;
    
    
    const response = {
      topic,
      success: true,
      processingTime,
      timestamp: new Date().toISOString(),
      source: 'openai',
      requestId,
      debug: {
        inputTimestamp: timestamp,
        serverTime: Date.now()
      }
    };
    
    console.log(`Returning response for request ${requestId}:`, response);
    
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Vary': 'Accept-Encoding',
        'X-Request-ID': requestId
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

