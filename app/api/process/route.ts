// API route for processing video/audio (Next.js App Router)

import { NextRequest, NextResponse } from 'next/server';
import { interpretExpression } from '@/lib/openai';

// Note: For Whisper transcription, we'll use OpenAI's Whisper API
// since running Whisper locally in Node.js is complex
async function transcribeAudio(audioBlob: Blob): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');

    console.log('Sending audio to Whisper API, size:', audioBlob.size);

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formData,
    });

    console.log('Whisper API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Whisper API error:', errorText);
      throw new Error(`Transcription failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Whisper API response:', data);
    return data.text || 'No speech detected.';
  } catch (error: any) {
    console.error('Transcription error:', error);
    throw new Error(`Audio transcription failed: ${error.message}`);
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('🚀 API request started at:', new Date().toISOString());
  
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OpenAI API key not configured');
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to environment variables.' },
        { status: 500 }
      );
    }

    console.log('📥 Parsing form data...');
    const formData = await request.formData();
    
    console.log('📋 Form data keys:', Array.from(formData.keys()));
    
    const videoFile = formData.get('video') as File;
    const audioFile = formData.get('audio') as File;

    console.log('📹 Video file:', videoFile ? `${videoFile.name} (${videoFile.size} bytes, ${videoFile.type})` : 'null');
    console.log('🎵 Audio file:', audioFile ? `${audioFile.name} (${audioFile.size} bytes, ${audioFile.type})` : 'null');

    if (!videoFile || !audioFile) {
      console.error('❌ Missing files - video:', !!videoFile, 'audio:', !!audioFile);
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

    // Validate file sizes
    if (videoFile.size === 0 || audioFile.size === 0) {
      return NextResponse.json(
        { error: 'Video or audio file is empty' },
        { status: 400 }
      );
    }

    // Transcribe audio using OpenAI Whisper API
    let transcription = 'No speech detected.';
    try {
      console.log('🎵 Starting audio transcription...');
      // Create a new blob from the file to avoid "body disturbed" issues
      const audioBuffer = await audioFile.arrayBuffer();
      console.log('📊 Audio buffer size:', audioBuffer.byteLength);
      
      const audioBlob = new Blob([audioBuffer], { type: audioFile.type || 'audio/webm' });
      console.log('🔄 Created audio blob, size:', audioBlob.size);
      
      transcription = await transcribeAudio(audioBlob);
      console.log('✅ Transcription successful:', transcription.substring(0, 100) + '...');
    } catch (transcriptionError: any) {
      console.error('❌ Transcription failed:', transcriptionError);
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
      console.log('🤖 Starting AI analysis...');
      analysis = await interpretExpression(aus, metrics);
      console.log('✅ Analysis successful, length:', analysis.length);
    } catch (analysisError: any) {
      console.error('❌ Analysis failed:', analysisError);
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

    const processingTime = Date.now() - startTime;
    console.log('✅ Request completed successfully in', processingTime, 'ms');

    return NextResponse.json({
      transcription,
      analysis,
      aus,
      metrics,
      processingTime
    });
  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error('❌ Request failed after', processingTime, 'ms:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error',
      details: error.stack || 'No stack trace available',
      processingTime
    }, { status: 500 });
  }
}

