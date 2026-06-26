import { callLLM, parseJSON } from './llm';
import type {
  ResumeAnalysis, JobAnalysis, GapAnalysis,
  OptimizedResume, Scores, PassingChance, PipelineResult,
} from '@/types/cv';

const LANG_INSTRUCTION: Record<string, string> = {
  en: 'Respond entirely in English.',
  es: 'Responde completamente en español.',
  fr: 'Réponds entièrement en français.',
  ru: 'Отвечай полностью на русском языке.',
};

export async function runPipeline(
  resumeText: string,
  jobDescription: string,
  language = 'en',
  additionalContext = '',
): Promise<PipelineResult> {
  const lang = LANG_INSTRUCTION[language] ?? LANG_INSTRUCTION.en;
  const extraSection = additionalContext
    ? `\n\nADDITIONAL CANDIDATE DOCUMENTS (certificates, cover letter, etc.):\n${additionalContext}`
    : '';

  const resumeAnalysisRaw = await callLLM(`${lang}
Analyze this resume and return JSON with this exact schema:
{
  "structure": <1-10>, "readability": <1-10>, "atsCompatibility": <1-10>,
  "keywordCoverage": <1-10>, "careerProgression": <1-10>, "technicalDepth": <1-10>,
  "measurableAchievements": <1-10>, "grammar": <1-10>, "consistency": <1-10>,
  "overallScore": <1-10>, "strengths": ["..."], "weaknesses": ["..."]
}
RESUME:
${resumeText}${extraSection}
`);
  const resumeAnalysis = parseJSON<ResumeAnalysis>(resumeAnalysisRaw);

  const jobAnalysisRaw = await callLLM(`${lang}
Analyze this job description and return JSON with this exact schema:
{
  "requiredSkills": ["..."], "preferredSkills": ["..."], "atsKeywords": ["..."],
  "softSkills": ["..."], "responsibilities": ["..."],
  "seniorityLevel": "...", "jobTitle": "...", "industry": "..."
}
JOB DESCRIPTION:
${jobDescription}
`);
  const jobAnalysis = parseJSON<JobAnalysis>(jobAnalysisRaw);

  const gapAnalysisRaw = await callLLM(`${lang}
Compare this resume to the job description and return JSON with this exact schema:
{
  "strongMatches": ["..."], "partialMatches": ["..."], "missing": ["..."],
  "weakSections": ["..."], "opportunities": ["..."]
}
RESUME:
${resumeText}${extraSection}
JOB DESCRIPTION:
${jobDescription}
`);
  const gapAnalysis = parseJSON<GapAnalysis>(gapAnalysisRaw);

  const optimizedRaw = await callLLM(`${lang}
Rewrite and ATS-optimize this resume for the target job. Return JSON with this exact schema:
{
  "professionalSummary": "2-3 sentence summary",
  "experience": [{"company":"...","title":"...","startDate":"...","endDate":"...","bullets":["..."]}],
  "skills": [{"category":"...","skills":["..."]}],
  "education": [{"institution":"...","degree":"...","field":"...","graduationDate":"..."}],
  "certifications": ["..."],
  "languages": [{"language":"...","proficiency":"..."}],
  "missingInfo": ["..."]
}
CRITICAL RULES:
- Use ONLY facts from the resume and additional documents below. Do NOT invent data.
- Naturally integrate these ATS keywords where truthfully applicable: ${jobAnalysis.atsKeywords.slice(0, 20).join(', ')}
- If additional documents mention certifications or skills, include them.
- Use strong action verbs. Metrics ONLY if in original resume.
- Empty arrays for sections with no data.

RESUME:
${resumeText}${extraSection}
TARGET JOB:
${jobDescription}
`);
  const optimizedResume = parseJSON<OptimizedResume>(optimizedRaw);

  const scoresRaw = await callLLM(`${lang}
Score this optimized resume against the job description. Return JSON:
{
  "atsCompatibility": <1-100>, "recruiterAppeal": <1-100>,
  "overallQuality": <1-100>, "competitiveness": <1-100>,
  "remainingWeaknesses": ["..."]
}
OPTIMIZED RESUME SUMMARY:
${optimizedResume.professionalSummary}
Skills: ${optimizedResume.skills.flatMap(s => s.skills).join(', ')}
JOB DESCRIPTION:
${jobDescription}
`);
  const scores = parseJSON<Scores>(scoresRaw);

  const passingChanceRaw = await callLLM(`${lang}
Estimate the candidate's realistic chance of passing the FIRST screening stage (ATS + initial recruiter review).
Return JSON:
{
  "percentage": <0-100>,
  "verdict": <"Strong"|"Good"|"Fair"|"Weak">,
  "summary": "2-3 sentence honest assessment",
  "keyStrengths": ["top 2-3 things working in their favor"],
  "keyRisks": ["top 2-3 things that could get them screened out"],
  "tips": ["1-2 actionable tips"]
}
Rules: Strong=75-100%, Good=50-74%, Fair=25-49%, Weak=0-24%

OPTIMIZED RESUME:
${optimizedResume.professionalSummary}
Experience: ${optimizedResume.experience.map(e => `${e.title} at ${e.company}`).join(', ')}
Skills: ${optimizedResume.skills.flatMap(s => s.skills).join(', ')}
JOB REQUIREMENTS:
${jobDescription}
Gap: strong=${gapAnalysis.strongMatches.join(', ')} | missing=${gapAnalysis.missing.join(', ')}
`);
  const passingChance = parseJSON<PassingChance>(passingChanceRaw);

  return { resumeAnalysis, jobAnalysis, gapAnalysis, optimizedResume, scores, passingChance };
}
