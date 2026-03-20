import { NextRequest, NextResponse } from 'next/server';
import { interpretExpression } from '@/lib/openai';

// Configure route segment
export const maxDuration = 60; // Maximum duration in seconds
export const dynamic = 'force-dynamic'; // Disable static optimization

async function transcribeAudio(audioBlob: Blob): Promise<{ text: string; words?: Array<{ word: string; start: number; end: number }> }> {
  try {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'verbose_json');
    formData.append('timestamp_granularities[]', 'word');

    console.log('sending audio to whisper api, size:', audioBlob.size);

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formData,
    });

    const responseText = await response.text();
    console.log("whisper api repsonse text: ", responseText);

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
    
    // Extract word-level timestamps if available
    const words = data.words?.map((w: any) => ({
      word: w.word,
      start: w.start,
      end: w.end
    })) || [];
    
    return {
      text: data.text || 'No speech detected.',
      words: words.length > 0 ? words : undefined
    };
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
    // log the video and audio file sizes
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
    let transcriptionWords: Array<{ word: string; start: number; end: number }> | undefined = undefined;
    try {
      console.log('starting audio transcription...');
      const audioBuffer = await audioFile.arrayBuffer();
      console.log('audio buffer size:', audioBuffer.byteLength);
      
      const audioBlob = new Blob([audioBuffer], { type: audioFile.type || 'audio/webm' });
      console.log('created audio blob, size:', audioBlob.size);
      
      const transcriptionResult = await transcribeAudio(audioBlob);
      transcription = transcriptionResult.text;
      transcriptionWords = transcriptionResult.words;
      console.log('transcription successful:', transcription.substring(0, 100) + '...');
      console.log('word timestamps:', transcriptionWords?.length || 0, 'words');
    } catch (transcriptionError: any) {
      console.error('transcription failed:', transcriptionError);
      transcription = 'Audio transcription failed: ' + transcriptionError.message;
    }

    const ausString = formData.get('aus') as string;
    const metricsString = formData.get('metrics') as string;
    const ausMinString = formData.get('ausMin') as string;
    const ausMaxString = formData.get('ausMax') as string;
    const metricsMinString = formData.get('metricsMin') as string;
    const metricsMaxString = formData.get('metricsMax') as string;
    const ausTrendsString = formData.get('ausTrends') as string;
    const metricsTrendsString = formData.get('metricsTrends') as string;
    const frameCountString = formData.get('frameCount') as string;
    const timestampedFramesString = formData.get('timestampedFrames') as string;
    const audioToneDataString = formData.get('audioToneData') as string;
    const topic = formData.get('topic') as string;
    
    console.log('received aus:', ausString);
    console.log('received metrics:', metricsString);
    console.log('received frameCount:', frameCountString);
    console.log('received topic:', topic);

    let aus: Record<string, number> = {};
    let metrics: Record<string, number> = {};
    let ausMin: Record<string, number> = {};
    let ausMax: Record<string, number> = {};
    let metricsMin: Record<string, number> = {};
    let metricsMax: Record<string, number> = {};
    let ausTrends: Record<string, number> = {};
    let metricsTrends: Record<string, number> = {};
    let frameCount: number = 0;
    let timestampedFrames: Array<{ aus: Record<string, number>; metrics: Record<string, number>; timestamp: number }> = [];
    let audioToneData: Array<{ pitch: number; volume: number; timestamp: number }> = [];

    try {
      aus = JSON.parse(ausString || '{}');
      metrics = JSON.parse(metricsString || '{}');
      ausMin = JSON.parse(ausMinString || '{}');
      ausMax = JSON.parse(ausMaxString || '{}');
      metricsMin = JSON.parse(metricsMinString || '{}');
      metricsMax = JSON.parse(metricsMaxString || '{}');
      ausTrends = JSON.parse(ausTrendsString || '{}');
      metricsTrends = JSON.parse(metricsTrendsString || '{}');
      frameCount = parseInt(frameCountString || '0', 10);
      timestampedFrames = timestampedFramesString ? JSON.parse(timestampedFramesString) : [];
      audioToneData = audioToneDataString ? JSON.parse(audioToneDataString) : [];
    } catch (parseError) {
      console.error('failed to parse aus/metrics:', parseError);
      return NextResponse.json(
        { error: 'Invalid facial analysis data format' },
        { status: 400 }
      );
    }
    
    console.log(`Frame collection: ${frameCount} frames captured`);
    if (frameCount < 50) {
      console.warn(`WARNING: Low frame count (${frameCount}). Face detection may have issues.`);
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
      console.log('transcription:', transcription);
      
      // Create time-aligned data structure (only if we have the data)
      const timeAlignedData = (transcriptionWords && transcriptionWords.length > 0 && timestampedFrames.length > 0) ? {
        transcriptionWords: transcriptionWords,
        timestampedFrames: timestampedFrames,
        audioToneData: audioToneData.length > 0 ? audioToneData.map(d => ({
          pitch: d.pitch,
          volume: d.volume,
          timestamp: (d.timestamp - (audioToneData[0]?.timestamp || 0)) / 1000 // Convert to seconds relative to start
        })) : []
      } : undefined;
      
      console.log('Time-aligned data:', {
        hasWords: transcriptionWords?.length || 0,
        hasFrames: timestampedFrames.length,
        hasAudioTone: audioToneData.length
      });
      
      rizzResult = await interpretExpression(
        aus, 
        metrics, 
        transcription, 
        topic, 
        {
          ausMin,
          ausMax,
          metricsMin,
          metricsMax,
          ausTrends,
          metricsTrends,
          frameCount
        },
        timeAlignedData
      );
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

