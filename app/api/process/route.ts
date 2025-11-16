// API route for processing video/audio (Next.js App Router)

import { NextRequest, NextResponse } from 'next/server';
import { interpretExpression } from '@/lib/openai';

// Note: For Whisper transcription, we'll use OpenAI's Whisper API
// since running Whisper locally in Node.js is complex
async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.webm');
  formData.append('model', 'whisper-1');

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Transcription failed');
  }

  const data = await response.json();
  return data.text || 'No speech detected.';
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const videoFile = formData.get('video') as File;
    const audioFile = formData.get('audio') as File;

    if (!videoFile || !audioFile) {
      return NextResponse.json(
        { error: 'Missing video or audio file' },
        { status: 400 }
      );
    }

    // Transcribe audio using OpenAI Whisper API
    const audioBlob = await audioFile.arrayBuffer();
    const transcription = await transcribeAudio(new Blob([audioBlob]));

    // For video processing, we'll process it client-side with MediaPipe
    // and send the AUs/metrics here. For now, we'll expect them in the request
    const aus = JSON.parse(formData.get('aus') as string || '{}');
    const metrics = JSON.parse(formData.get('metrics') as string || '{}');

    if (!aus || Object.keys(aus).length === 0 || !metrics || Object.keys(metrics).length === 0) {
      return NextResponse.json(
        {
          error: 'Could not detect face in video. Please ensure your face is visible.',
          transcription,
        },
        { status: 400 }
      );
    }

    // Generate analysis
    const analysis = await interpretExpression(aus, metrics);

    return NextResponse.json({
      transcription,
      analysis,
      aus,
      metrics,
    });
  } catch (error: any) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

