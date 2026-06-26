import { callLLM, parseJSON } from './llm';
import type {
  ResumeAnalysis,
  JobAnalysis,
  GapAnalysis,
  OptimizedResume,
  Scores,
  PassingChance,
  PipelineResult,
} from '@/types/cv';

export async function runPipeline(
  resumeText: string,
  jobDescription: string
): Promise<PipelineResult> {
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

  const passingChanceRaw = await callLLM(`
Based on this resume and job description, estimate the candidate's realistic chance of passing the FIRST screening stage (ATS + initial recruiter review). Be honest and realistic.

Return JSON with this exact schema:
{
  "percentage": <0-100>,
  "verdict": <"Strong" | "Good" | "Fair" | "Weak">,
  "summary": "2-3 sentence honest assessment of first-stage chances",
  "keyStrengths": ["top 2-3 things working in their favor"],
  "keyRisks": ["top 2-3 things that could get them screened out"],
  "tips": ["1-2 actionable tips to improve chances further"]
}

Rules:
- verdict "Strong" = 75-100%, "Good" = 50-74%, "Fair" = 25-49%, "Weak" = 0-24%
- Be realistic. Consider ATS keyword match, experience level match, required skills coverage.

OPTIMIZED RESUME:
${optimizedResume.professionalSummary}
Experience: ${optimizedResume.experience.map(e => `${e.title} at ${e.company}`).join(', ')}
Skills: ${optimizedResume.skills.flatMap(s => s.skills).join(', ')}

JOB REQUIREMENTS:
${jobDescription}

GAP ANALYSIS:
Strong matches: ${gapAnalysis.strongMatches.join(', ')}
Missing: ${gapAnalysis.missing.join(', ')}
`);
  const passingChance = parseJSON<PassingChance>(passingChanceRaw);

  return { resumeAnalysis, jobAnalysis, gapAnalysis, optimizedResume, scores, passingChance };
}
