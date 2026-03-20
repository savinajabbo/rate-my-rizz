import { NextRequest, NextResponse } from 'next/server';
import { interpretExpression } from '@/lib/openai';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('skip-audio api request started at:', new Date().toISOString());
  
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
    
    const ausString = formData.get('aus') as string;
    const metricsString = formData.get('metrics') as string;
    const ausMinString = formData.get('ausMin') as string;
    const ausMaxString = formData.get('ausMax') as string;
    const metricsMinString = formData.get('metricsMin') as string;
    const metricsMaxString = formData.get('metricsMax') as string;
    const ausTrendsString = formData.get('ausTrends') as string;
    const metricsTrendsString = formData.get('metricsTrends') as string;
    const frameCountString = formData.get('frameCount') as string;
    const topic = formData.get('topic') as string;
    
    console.log('received aus:', ausString?.substring(0, 100) + '...');
    console.log('received metrics:', metricsString?.substring(0, 100) + '...');
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

    try {
      aus = JSON.parse(ausString || '{}');
      metrics = JSON.parse(metricsString || '{}');
      ausMin = ausMinString ? JSON.parse(ausMinString) : {};
      ausMax = ausMaxString ? JSON.parse(ausMaxString) : {};
      metricsMin = metricsMinString ? JSON.parse(metricsMinString) : {};
      metricsMax = metricsMaxString ? JSON.parse(metricsMaxString) : {};
      ausTrends = ausTrendsString ? JSON.parse(ausTrendsString) : {};
      metricsTrends = metricsTrendsString ? JSON.parse(metricsTrendsString) : {};
      frameCount = frameCountString ? parseInt(frameCountString, 10) : 0;
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
          transcription: 'Audio transcription skipped for testing',
        },
        { status: 400 }
      );
    }

    let rizzResult = { score: 50, rizzType: 'mysterious vibes', analysis: 'Analysis unavailable' };
    try {
      console.log('starting ai analysis (no audio)...');
      const temporalData = (Object.keys(ausMin).length > 0 || Object.keys(metricsMin).length > 0) ? {
        ausMin,
        ausMax,
        metricsMin,
        metricsMax,
        ausTrends,
        metricsTrends,
        frameCount
      } : undefined;
      rizzResult = await interpretExpression(aus, metrics, undefined, topic, temporalData, undefined);
      console.log('analysis successful, score:', rizzResult.score, 'type:', rizzResult.rizzType);
    } catch (analysisError: any) {
      console.error('analysis failed:', analysisError);
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
    console.log('skip-audio request completed successfully in', processingTime, 'ms');

    return NextResponse.json({
      transcription: 'audio transcription skipped for testing - facial analysis only',
      score: rizzResult.score,
      rizzType: rizzResult.rizzType,
      analysis: rizzResult.analysis,
      aus,
      metrics,
      processingTime,
      mode: 'skip-audio'
    });
  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error('skip-audio request failed after', processingTime, 'ms:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error',
      details: error.stack || 'No stack trace available',
      processingTime,
      mode: 'skip-audio'
    }, { status: 500 });
  }
}
