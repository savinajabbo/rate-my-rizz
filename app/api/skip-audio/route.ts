import { NextRequest, NextResponse } from 'next/server';
import { interpretExpression } from '@/lib/openai';

// Fallback endpoint that skips audio transcription to isolate the issue
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('🚀 Skip-audio API request started at:', new Date().toISOString());
  
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
    
    // Skip video/audio processing, just get AUs and metrics
    const ausString = formData.get('aus') as string;
    const metricsString = formData.get('metrics') as string;
    
    console.log('📊 Received AUs:', ausString?.substring(0, 100) + '...');
    console.log('📊 Received metrics:', metricsString?.substring(0, 100) + '...');

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
          transcription: 'Audio transcription skipped for testing',
        },
        { status: 400 }
      );
    }

    // Generate analysis without audio transcription
    let analysis = 'Analysis unavailable';
    try {
      console.log('🤖 Starting AI analysis (no audio)...');
      analysis = await interpretExpression(aus, metrics);
      console.log('✅ Analysis successful, length:', analysis.length);
    } catch (analysisError: any) {
      console.error('❌ Analysis failed:', analysisError);
      return NextResponse.json(
        { 
          error: 'AI analysis failed: ' + analysisError.message,
          transcription: 'Audio transcription skipped for testing',
          aus,
          metrics
        },
        { status: 500 }
      );
    }

    const processingTime = Date.now() - startTime;
    console.log('✅ Skip-audio request completed successfully in', processingTime, 'ms');

    return NextResponse.json({
      transcription: 'Audio transcription skipped for testing - facial analysis only',
      analysis,
      aus,
      metrics,
      processingTime,
      mode: 'skip-audio'
    });
  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error('❌ Skip-audio request failed after', processingTime, 'ms:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error',
      details: error.stack || 'No stack trace available',
      processingTime,
      mode: 'skip-audio'
    }, { status: 500 });
  }
}
