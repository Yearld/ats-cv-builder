import { callLLM, parseJSON } from './llm';
import type {
  ResumeAnalysis,
  JobAnalysis,
  GapAnalysis,
  OptimizedResume,
  Scores,
  PipelineResult,
} from '@/types/cv';

export async function runPipeline(
  resumeText: string,
  jobDescription: string
): Promise<PipelineResult> {
  // Step 1: Resume analysis
  const resumeAnalysisRaw = await callLLM(`
Analyze this resume and return JSON with this exact schema:
{
  "structure": <1-10>,
  "readability": <1-10>,
  "atsCompatibility": <1-10>,
  "keywordCoverage": <1-10>,
  "careerProgression": <1-10>,
  "technicalDepth": <1-10>,
  "measurableAchievements": <1-10>,
  "grammar": <1-10>,
  "consistency": <1-10>,
  "overallScore": <1-10>,
  "strengths": ["..."],
  "weaknesses": ["..."]
}

RESUME:
${resumeText}
`);
  const resumeAnalysis = parseJSON<ResumeAnalysis>(resumeAnalysisRaw);

  // Step 2: Job analysis
  const jobAnalysisRaw = await callLLM(`
Analyze this job description and return JSON with this exact schema:
{
  "requiredSkills": ["..."],
  "preferredSkills": ["..."],
  "atsKeywords": ["..."],
  "softSkills": ["..."],
  "responsibilities": ["..."],
  "seniorityLevel": "...",
  "jobTitle": "...",
  "industry": "..."
}

JOB DESCRIPTION:
${jobDescription}
`);
  const jobAnalysis = parseJSON<JobAnalysis>(jobAnalysisRaw);

  // Step 3: Gap analysis
  const gapAnalysisRaw = await callLLM(`
Compare this resume to the job description and return JSON with this exact schema:
{
  "strongMatches": ["skills/experiences that match well"],
  "partialMatches": ["skills/experiences that partially match"],
  "missing": ["required skills/experiences not present in resume"],
  "weakSections": ["sections that need improvement"],
  "opportunities": ["ways to improve resume presentation without fabrication"]
}

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}
`);
  const gapAnalysis = parseJSON<GapAnalysis>(gapAnalysisRaw);

  // Step 4 & 5: Rewrite and ATS-optimize
  const optimizedRaw = await callLLM(`
Rewrite and ATS-optimize this resume for the target job. Return JSON with this exact schema:
{
  "professionalSummary": "2-3 sentence summary",
  "experience": [
    {
      "company": "...",
      "title": "...",
      "startDate": "...",
      "endDate": "...",
      "bullets": ["strong action verb + achievement bullet", "..."]
    }
  ],
  "skills": [
    { "category": "...", "skills": ["..."] }
  ],
  "education": [
    {
      "institution": "...",
      "degree": "...",
      "field": "...",
      "graduationDate": "..."
    }
  ],
  "certifications": ["..."],
  "languages": [
    { "language": "...", "proficiency": "..." }
  ],
  "missingInfo": ["list any critical info absent from the resume that would help, if none leave empty array"]
}

CRITICAL RULES:
- Use ONLY facts from the resume below. Do NOT invent any data.
- Naturally integrate these ATS keywords where truthfully applicable: ${jobAnalysis.atsKeywords.slice(0, 20).join(', ')}
- Use strong action verbs. Include metrics ONLY if they appear in the original resume.
- If a section (certifications, languages) has no data in the resume, return empty arrays.

RESUME:
${resumeText}

TARGET JOB:
${jobDescription}
`);
  const optimizedResume = parseJSON<OptimizedResume>(optimizedRaw);

  // Step 6: Final scores
  const scoresRaw = await callLLM(`
Score this optimized resume against the job description and return JSON with this exact schema:
{
  "atsCompatibility": <1-100>,
  "recruiterAppeal": <1-100>,
  "overallQuality": <1-100>,
  "competitiveness": <1-100>,
  "remainingWeaknesses": ["..."]
}

OPTIMIZED RESUME SUMMARY:
${optimizedResume.professionalSummary}

Skills covered: ${optimizedResume.skills.flatMap(s => s.skills).join(', ')}

JOB DESCRIPTION:
${jobDescription}
`);
  const scores = parseJSON<Scores>(scoresRaw);

  return { resumeAnalysis, jobAnalysis, gapAnalysis, optimizedResume, scores };
}
