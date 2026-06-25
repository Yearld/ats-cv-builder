import { NextRequest, NextResponse } from 'next/server';
import { runPipeline } from '@/lib/pipeline';

export async function POST(req: NextRequest) {
  try {
    const { resumeText, jobDescription } = await req.json();

    if (!resumeText || !jobDescription) {
      return NextResponse.json(
        { error: 'resumeText and jobDescription are required' },
        { status: 400 }
      );
    }

    const result = await runPipeline(resumeText, jobDescription);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Pipeline error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
