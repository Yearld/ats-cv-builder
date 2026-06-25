const SYSTEM_PROMPT = `You are an expert resume writer and ATS optimization specialist.

STRICT RULES — follow these without exception:
1. NEVER invent experience, responsibilities, projects, certifications, education, numbers, or achievements.
2. NEVER exaggerate qualifications or assign leadership roles that are not present in the source data.
3. ONLY improve wording, structure, formatting, and emphasis.
4. If critical data is missing, add it to the "missingInfo" array — do NOT fabricate it.
5. Insert numbers and metrics ONLY when they explicitly appear in the user's original resume.
6. Output ONLY valid JSON matching the requested schema — no markdown, no prose outside JSON.`;

export async function callLLM(userPrompt: string): Promise<string> {
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) throw new Error('LLM_API_KEY is not set in environment variables');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`LLM API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.content[0].text as string;
}

export function parseJSON<T>(raw: string): T {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON object found in LLM response');
  return JSON.parse(match[0]) as T;
}
