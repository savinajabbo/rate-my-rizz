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
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to environment variables.' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const videoFile = formData.get('video') as File;
    const audioFile = formData.get('audio') as File;

    if (!videoFile || !audioFile) {
      return NextResponse.json(
        { error: 'Missing video or audio file' },
        { status: 400 }
      );
    }

    console.log('Processing files:', { 
      videoSize: videoFile.size, 
      audioSize: audioFile.size,
      videoType: videoFile.type,
      audioType: audioFile.type
    });

    // Transcribe audio using OpenAI Whisper API
    let transcription = 'No speech detected.';
    try {
      const audioBlob = await audioFile.arrayBuffer();
      transcription = await transcribeAudio(new Blob([audioBlob]));
      console.log('Transcription successful:', transcription);
    } catch (transcriptionError: any) {
      console.error('Transcription failed:', transcriptionError);
      // Continue without transcription rather than failing completely
      transcription = 'Audio transcription failed: ' + transcriptionError.message;
    }

    // For video processing, we'll process it client-side with MediaPipe
    // and send the AUs/metrics here. For now, we'll expect them in the request
    const ausString = formData.get('aus') as string;
    const metricsString = formData.get('metrics') as string;
    
    console.log('Received AUs:', ausString);
    console.log('Received metrics:', metricsString);

    let aus: Record<string, number> = {};
    let metrics: Record<string, number> = {};

    try {
      aus = JSON.parse(ausString || '{}');
      metrics = JSON.parse(metricsString || '{}');
    } catch (parseError) {
      console.error('Failed to parse AUs/metrics:', parseError);
      return NextResponse.json(
        { error: 'Invalid facial analysis data format' },
        { status: 400 }
      );
    }

    if (!aus || Object.keys(aus).length === 0 || !metrics || Object.keys(metrics).length === 0) {
      return NextResponse.json(
        {
          error: 'Could not detect face in video. Please ensure your face is visible and well-lit.',
          transcription,
        },
        { status: 400 }
      );
    }

    // Generate analysis
    let analysis = 'Analysis unavailable';
    try {
      analysis = await interpretExpression(aus, metrics);
      console.log('Analysis successful');
    } catch (analysisError: any) {
      console.error('Analysis failed:', analysisError);
      return NextResponse.json(
        { 
          error: 'AI analysis failed: ' + analysisError.message,
          transcription,
          aus,
          metrics
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      transcription,
      analysis,
      aus,
      metrics,
    });
  } catch (error: any) {
    console.error('Error processing request:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error',
      details: error.stack || 'No stack trace available'
    }, { status: 500 });
  }
}

