import { NextResponse } from 'next/server';
import { generateRandomDateTopic } from '@/lib/openai';

export async function GET() {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  console.log('🟢 Random topic API called at:', new Date().toISOString(), 'Request ID:', requestId);
  console.log('🟢 Environment check - API key exists:', !!process.env.OPENAI_API_KEY);
  console.log('🟢 Environment check - API key length:', process.env.OPENAI_API_KEY?.length || 0);
  
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

    console.log('🟢 Generating random date topic with OpenAI... Request ID:', requestId);
    const topic = await generateRandomDateTopic();
    const processingTime = Date.now() - startTime;
    
    console.log(`🟢 Successfully generated topic: "${topic}" (${processingTime}ms) Request ID: ${requestId}`);
    
    return NextResponse.json(
      { 
        topic,
        success: true,
        processingTime,
        timestamp: new Date().toISOString(),
        source: 'openai'
      }, 
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Processing-Time': `${processingTime}ms`
        }
      }
    );
    
  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error('Error generating random topic:', {
      error: error.message,
      stack: error.stack,
      processingTime
    });
    
    // Return detailed error information
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

