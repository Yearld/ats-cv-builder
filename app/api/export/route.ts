import { NextRequest, NextResponse } from 'next/server';
import { buildDocx } from '@/lib/docx';
import type { OptimizedResume } from '@/types/cv';

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
    const { resume, candidateName, format } = await req.json() as {
      resume: OptimizedResume;
      candidateName?: string;
      format: 'pdf' | 'docx';
    };

    if (format === 'docx') {
      const buffer = await buildDocx(resume, candidateName);
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': 'attachment; filename="optimized-resume.docx"',
        },
      });
    }

    if (format === 'pdf') {
      const { renderToBuffer } = await import('@react-pdf/renderer');
      const { ResumePDF } = await import('@/lib/pdf');
      const React = (await import('react')).default;
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const element = React.createElement(ResumePDF, { resume, candidateName }) as any;
      /* eslint-enable @typescript-eslint/no-explicit-any */
      const buffer = await renderToBuffer(element);
      return new NextResponse(new Uint8Array(buffer as Buffer), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="optimized-resume.pdf"',
        },
      });
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400, headers: corsHeaders });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Export error';
    return NextResponse.json({ error: message }, { status: 500, headers: corsHeaders });
  }
}
