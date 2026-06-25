export interface ResumeAnalysis {
  structure: number;
  readability: number;
  atsCompatibility: number;
  keywordCoverage: number;
  careerProgression: number;
  technicalDepth: number;
  measurableAchievements: number;
  grammar: number;
  consistency: number;
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
}

export interface JobAnalysis {
  requiredSkills: string[];
  preferredSkills: string[];
  atsKeywords: string[];
  softSkills: string[];
  responsibilities: string[];
  seniorityLevel: string;
  jobTitle: string;
  industry: string;
}

export interface GapAnalysis {
  strongMatches: string[];
  partialMatches: string[];
  missing: string[];
  weakSections: string[];
  opportunities: string[];
}

export interface OptimizedResume {
  professionalSummary: string;
  experience: ExperienceEntry[];
  skills: SkillGroup[];
  education: EducationEntry[];
  certifications: string[];
  languages: LanguageEntry[];
  missingInfo: string[];
}

export interface ExperienceEntry {
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  bullets: string[];
}

export interface SkillGroup {
  category: string;
  skills: string[];
}

export interface EducationEntry {
  institution: string;
  degree: string;
  field: string;
  graduationDate: string;
}

export interface LanguageEntry {
  language: string;
  proficiency: string;
}

export interface Scores {
  atsCompatibility: number;
  recruiterAppeal: number;
  overallQuality: number;
  competitiveness: number;
  remainingWeaknesses: string[];
}

export interface PipelineResult {
  resumeAnalysis: ResumeAnalysis;
  jobAnalysis: JobAnalysis;
  gapAnalysis: GapAnalysis;
  optimizedResume: OptimizedResume;
  scores: Scores;
}
