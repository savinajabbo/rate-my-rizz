import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'API is working',
    timestamp: new Date().toISOString(),
    openaiConfigured: !!process.env.OPENAI_API_KEY,
    environment: process.env.NODE_ENV || 'unknown'
  });
}
