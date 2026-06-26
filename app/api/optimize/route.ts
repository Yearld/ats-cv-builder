import { NextRequest, NextResponse } from 'next/server';
import { runPipeline } from '@/lib/pipeline';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const { resumeText, jobDescription, language, additionalContext } = await req.json();
    if (!resumeText || !jobDescription) {
      return NextResponse.json(
        { error: 'resumeText and jobDescription are required' },
        { status: 400, headers: corsHeaders }
      );
    }
    const result = await runPipeline(resumeText, jobDescription, language ?? 'en', additionalContext ?? '');
    return NextResponse.json(result, { headers: corsHeaders });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Pipeline error';
    return NextResponse.json({ error: message }, { status: 500, headers: corsHeaders });
  }
}
