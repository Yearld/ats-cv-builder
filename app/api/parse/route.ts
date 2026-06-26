import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400, headers: corsHeaders });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const mimeType = file.type;
    let text = '';

    if (mimeType === 'application/pdf' || file.name.endsWith('.pdf')) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfParse = (await import('pdf-parse') as any).default;
      const data = await pdfParse(buffer);
      text = data.text;
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.name.endsWith('.docx')
    ) {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (IMAGE_TYPES.includes(mimeType) || /\.(png|jpe?g|webp)$/i.test(file.name)) {
      const client = new Anthropic({ apiKey: process.env.LLM_API_KEY });
      const base64 = buffer.toString('base64');
      const mediaType = (IMAGE_TYPES.includes(mimeType) ? mimeType : 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/webp';
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
            { type: 'text', text: 'Extract all text and professional information from this document image. Include certifications, dates, issuing organizations, skills, and any other relevant professional details. Return plain text only.' },
          ],
        }],
      });
      text = response.content[0].type === 'text' ? response.content[0].text : '';
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload PDF, DOCX, PNG, or JPG.' },
        { status: 400, headers: corsHeaders }
      );
    }

    return NextResponse.json({ text: text.trim() }, { headers: corsHeaders });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Parse error';
    return NextResponse.json({ error: message }, { status: 500, headers: corsHeaders });
  }
}
