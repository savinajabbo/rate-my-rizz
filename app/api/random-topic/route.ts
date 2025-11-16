import { NextResponse } from 'next/server';
import { generateRandomDateTopic } from '@/lib/openai';

export async function GET() {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const topic = await generateRandomDateTopic();
    return NextResponse.json({ topic });
  } catch (error: any) {
    console.error('Error generating random topic:', error);
    return NextResponse.json(
      { error: 'Failed to generate topic', topic: 'mysterious subjects' },
      { status: 500 }
    );
  }
}
