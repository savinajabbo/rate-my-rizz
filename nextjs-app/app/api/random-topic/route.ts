import { NextResponse } from 'next/server';
import { generateRandomDateTopic } from '@/lib/openai';

export async function GET() {
  console.log('Random topic API called');
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.log('No OpenAI API key found');
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    console.log('Calling OpenAI to generate topic...');
    const topic = await generateRandomDateTopic();
    console.log('Generated topic:', topic);
    
    // Return with no-cache headers to prevent caching
    return NextResponse.json({ topic }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error: any) {
    console.error('Error generating random topic:', error);
    return NextResponse.json(
      { error: 'Failed to generate topic', topic: 'mysterious subjects' },
      { status: 500 }
    );
  }
}

