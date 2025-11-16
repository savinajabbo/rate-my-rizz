import { NextRequest, NextResponse } from 'next/server';
import { interpretExpression } from '@/lib/openai';

async function transcribeAudio(audioBlob: Blob): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');

    console.log('sending audio to whisper api, size:', audioBlob.size);

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formData,
    });

    console.log('whisper api response status:', response.status);

    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
      } catch (e) {
        errorText = 'Could not read error response';
      }
      console.error('whisper api error:', errorText);
      throw new Error(`Transcription failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('whisper api response:', data);
    return data.text || 'No speech detected.';
  } catch (error: any) {
    console.error('transcription error:', error);
    throw new Error(`Audio transcription failed: ${error.message}`);
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('api request started at:', new Date().toISOString());
  
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error('openai api key not configured');
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to environment variables.' },
        { status: 500 }
      );
    }

    console.log('parsing form data...');
    const formData = await request.formData();
    
    console.log('form data keys:', Array.from(formData.keys()));
    
    const videoFile = formData.get('video') as File;
    const audioFile = formData.get('audio') as File;

    console.log('video file:', videoFile ? `${videoFile.name} (${videoFile.size} bytes, ${videoFile.type})` : 'null');
    console.log('audio file:', audioFile ? `${audioFile.name} (${audioFile.size} bytes, ${audioFile.type})` : 'null');

    if (!videoFile || !audioFile) {
      console.error('missing files - video:', !!videoFile, 'audio:', !!audioFile);
      return NextResponse.json(
        { error: 'Missing video or audio file' },
        { status: 400 }
      );
    }

    console.log('processing files:', { 
      videoSize: videoFile.size, 
      audioSize: audioFile.size,
      videoType: videoFile.type,
      audioType: audioFile.type
    });

    if (videoFile.size === 0 || audioFile.size === 0) {
      return NextResponse.json(
        { error: 'Video or audio file is empty' },
        { status: 400 }
      );
    }

    let transcription = 'No speech detected.';
    try {
      console.log('starting audio transcription...');
      const audioBuffer = await audioFile.arrayBuffer();
      console.log('audio buffer size:', audioBuffer.byteLength);
      
      const audioBlob = new Blob([audioBuffer], { type: audioFile.type || 'audio/webm' });
      console.log('created audio blob, size:', audioBlob.size);
      
      transcription = await transcribeAudio(audioBlob);
      console.log('transcription successful:', transcription.substring(0, 100) + '...');
    } catch (transcriptionError: any) {
      console.error('transcription failed:', transcriptionError);
      transcription = 'Audio transcription failed: ' + transcriptionError.message;
    }

    const ausString = formData.get('aus') as string;
    const metricsString = formData.get('metrics') as string;
    
    console.log('received aus:', ausString);
    console.log('received metrics:', metricsString);

    let aus: Record<string, number> = {};
    let metrics: Record<string, number> = {};

    try {
      aus = JSON.parse(ausString || '{}');
      metrics = JSON.parse(metricsString || '{}');
    } catch (parseError) {
      console.error('failed to parse aus/metrics:', parseError);
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

    let rizzResult = { score: 50, rizzType: 'mysterious vibes', analysis: 'Analysis unavailable' };
    try {
      console.log('starting ai analysis...');
      rizzResult = await interpretExpression(aus, metrics);
      console.log('analysis successful, score:', rizzResult.score, 'type:', rizzResult.rizzType);
    } catch (analysisError: any) {
      console.error('analysis failed:', analysisError);
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
    console.log('request completed successfully in', processingTime, 'ms');

    return NextResponse.json({
      transcription,
      score: rizzResult.score,
      rizzType: rizzResult.rizzType,
      analysis: rizzResult.analysis,
      aus,
      metrics,
      processingTime
    });
  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error('request failed after', processingTime, 'ms:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error',
      details: error.stack || 'No stack trace available',
      processingTime
    }, { status: 500 });
  }
}

