'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PipelineResult, OptimizedResume, ExperienceEntry, SkillGroup } from '@/types/cv';

type Tab = 'analysis' | 'ats' | 'gap' | 'resume' | 'scores';

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('analysis');
  const [editableResume, setEditableResume] = useState<OptimizedResume | null>(null);
  const [exporting, setExporting] = useState<'pdf' | 'docx' | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('pipelineResult');
    if (!stored) { router.push('/'); return; }
    const parsed: PipelineResult = JSON.parse(stored);
    setResult(parsed);
    setEditableResume(JSON.parse(JSON.stringify(parsed.optimizedResume)));
  }, [router]);

  async function handleExport(format: 'pdf' | 'docx') {
    if (!editableResume) return;
    setExporting(format);
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume: editableResume, format }),
      });
      if (!res.ok) { alert('Export failed'); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `optimized-resume.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(null);
    }
  }

  if (!result || !editableResume) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading results…</p>
      </main>
    );
  }

  const { resumeAnalysis, jobAnalysis, gapAnalysis, scores } = result;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'analysis', label: 'Analysis' },
    { id: 'ats', label: 'ATS' },
    { id: 'gap', label: 'Gap Analysis' },
    { id: 'resume', label: 'Optimized Resume' },
    { id: 'scores', label: 'Scores' },
  ];

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Resume Optimized</h1>
            <p className="text-gray-500 text-sm">
              For: <span className="font-medium text-gray-700">{jobAnalysis.jobTitle}</span>
              {jobAnalysis.industry && ` · ${jobAnalysis.industry}`}
              {jobAnalysis.seniorityLevel && ` · ${jobAnalysis.seniorityLevel}`}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('pdf')}
              disabled={!!exporting}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {exporting === 'pdf' ? 'Generating…' : 'Download PDF'}
            </button>
            <button
              onClick={() => handleExport('docx')}
              disabled={!!exporting}
              className="bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {exporting === 'docx' ? 'Generating…' : 'Download DOCX'}
            </button>
            <button
              onClick={() => router.push('/')}
              className="border border-gray-300 text-gray-600 hover:bg-gray-100 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              New Resume
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 min-w-max py-2 px-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === t.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          {/* Analysis tab */}
          {activeTab === 'analysis' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Resume Analysis</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                {[
                  ['Structure', resumeAnalysis.structure],
                  ['Readability', resumeAnalysis.readability],
                  ['ATS Compatibility', resumeAnalysis.atsCompatibility],
                  ['Keyword Coverage', resumeAnalysis.keywordCoverage],
                  ['Career Progression', resumeAnalysis.careerProgression],
                  ['Technical Depth', resumeAnalysis.technicalDepth],
                  ['Measurable Achievements', resumeAnalysis.measurableAchievements],
                  ['Grammar', resumeAnalysis.grammar],
                  ['Consistency', resumeAnalysis.consistency],
                ].map(([label, score]) => (
                  <div key={label as string} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-1">{label}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-blue-500 rounded-full h-1.5 transition-all"
                          style={{ width: `${(score as number) * 10}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-700">{score}/10</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <Section title="Strengths" items={resumeAnalysis.strengths} color="green" />
                <Section title="Weaknesses" items={resumeAnalysis.weaknesses} color="red" />
              </div>
            </div>
          )}

          {/* ATS tab */}
          {activeTab === 'ats' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">ATS Keywords & Job Requirements</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Required Skills</h3>
                  <TagList items={jobAnalysis.requiredSkills} color="blue" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Preferred Skills</h3>
                  <TagList items={jobAnalysis.preferredSkills} color="purple" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">ATS Keywords</h3>
                  <TagList items={jobAnalysis.atsKeywords} color="gray" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Soft Skills</h3>
                  <TagList items={jobAnalysis.softSkills} color="yellow" />
                </div>
                <div className="md:col-span-2">
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Key Responsibilities</h3>
                  <ul className="space-y-1">
                    {jobAnalysis.responsibilities.map((r, i) => (
                      <li key={i} className="text-sm text-gray-700 flex gap-2">
                        <span className="text-gray-400 mt-0.5">•</span>{r}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Gap analysis tab */}
          {activeTab === 'gap' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Gap Analysis</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <Section title="Strong Matches" items={gapAnalysis.strongMatches} color="green" />
                <Section title="Partial Matches" items={gapAnalysis.partialMatches} color="yellow" />
                <Section title="Missing" items={gapAnalysis.missing} color="red" />
                <Section title="Weak Sections" items={gapAnalysis.weakSections} color="orange" />
              </div>
              {gapAnalysis.opportunities.length > 0 && (
                <div className="mt-4">
                  <Section title="Opportunities" items={gapAnalysis.opportunities} color="blue" />
                </div>
              )}
            </div>
          )}

          {/* Optimized resume tab */}
          {activeTab === 'resume' && (
            <div>
              <h2 className="text-lg font-semibold mb-1">Optimized Resume</h2>
              <p className="text-xs text-gray-400 mb-4">You can edit any field below before downloading.</p>

              {editableResume.missingInfo && editableResume.missingInfo.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                  <p className="text-sm font-semibold text-amber-800 mb-2">Missing Information</p>
                  <p className="text-xs text-amber-700 mb-2">Add this to your resume to improve results:</p>
                  <ul className="space-y-1">
                    {editableResume.missingInfo.map((m, i) => (
                      <li key={i} className="text-sm text-amber-800 flex gap-2">
                        <span className="text-amber-400 mt-0.5">!</span>{m}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <ResumeEditor resume={editableResume} onChange={setEditableResume} />
            </div>
          )}

          {/* Scores tab */}
          {activeTab === 'scores' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Final Scores</h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  ['ATS Compatibility', scores.atsCompatibility],
                  ['Recruiter Appeal', scores.recruiterAppeal],
                  ['Overall Quality', scores.overallQuality],
                  ['Competitiveness', scores.competitiveness],
                ].map(([label, score]) => (
                  <div key={label as string} className="bg-gray-50 rounded-2xl p-5 text-center">
                    <div className={`text-4xl font-bold mb-1 ${
                      (score as number) >= 80 ? 'text-green-600' :
                      (score as number) >= 60 ? 'text-yellow-600' : 'text-red-500'
                    }`}>
                      {score}
                    </div>
                    <div className="text-xs text-gray-500 font-medium">{label}</div>
                    <div className="mt-2 bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`rounded-full h-1.5 ${
                          (score as number) >= 80 ? 'bg-green-500' :
                          (score as number) >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {scores.remainingWeaknesses.length > 0 && (
                <Section title="Remaining Weaknesses" items={scores.remainingWeaknesses} color="red" />
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function Section({ title, items, color }: { title: string; items: string[]; color: string }) {
  const colors: Record<string, string> = {
    green: 'bg-green-50 border-green-200 text-green-800',
    red: 'bg-red-50 border-red-200 text-red-800',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    orange: 'bg-orange-50 border-orange-200 text-orange-800',
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    gray: 'bg-gray-50 border-gray-200 text-gray-700',
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color] ?? colors.gray}`}>
      <p className="text-xs font-semibold uppercase tracking-wide mb-2">{title}</p>
      {items.length === 0 ? (
        <p className="text-xs opacity-60">None</p>
      ) : (
        <ul className="space-y-1">
          {items.map((item, i) => (
            <li key={i} className="text-sm flex gap-2">
              <span className="opacity-40 mt-0.5">•</span>{item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TagList({ items, color }: { items: string[]; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-800',
    purple: 'bg-purple-100 text-purple-800',
    gray: 'bg-gray-100 text-gray-700',
    yellow: 'bg-yellow-100 text-yellow-800',
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <span key={i} className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[color] ?? colors.gray}`}>
          {item}
        </span>
      ))}
    </div>
  );
}

function ResumeEditor({
  resume,
  onChange,
}: {
  resume: OptimizedResume;
  onChange: (r: OptimizedResume) => void;
}) {
  function updateField<K extends keyof OptimizedResume>(key: K, value: OptimizedResume[K]) {
    onChange({ ...resume, [key]: value });
  }

  function updateExperience(idx: number, field: keyof ExperienceEntry, value: string | string[]) {
    const exp = [...resume.experience];
    exp[idx] = { ...exp[idx], [field]: value };
    updateField('experience', exp);
  }

  function updateSkillGroup(idx: number, field: keyof SkillGroup, value: string | string[]) {
    const skills = [...resume.skills];
    skills[idx] = { ...skills[idx], [field]: value };
    updateField('skills', skills);
  }

  return (
    <div className="space-y-6">
      {/* Professional Summary */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
          Professional Summary
        </label>
        <textarea
          value={resume.professionalSummary}
          onChange={e => updateField('professionalSummary', e.target.value)}
          rows={4}
          className="w-full border border-gray-200 rounded-lg p-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {/* Experience */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Experience</label>
        {resume.experience.map((exp, i) => (
          <div key={i} className="border border-gray-200 rounded-xl p-4 mb-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input
                value={exp.title}
                onChange={e => updateExperience(i, 'title', e.target.value)}
                placeholder="Job Title"
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                value={exp.company}
                onChange={e => updateExperience(i, 'company', e.target.value)}
                placeholder="Company"
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                value={exp.startDate}
                onChange={e => updateExperience(i, 'startDate', e.target.value)}
                placeholder="Start date"
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                value={exp.endDate}
                onChange={e => updateExperience(i, 'endDate', e.target.value)}
                placeholder="End date"
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <label className="text-xs text-gray-400">Bullets (one per line)</label>
            <textarea
              value={exp.bullets.join('\n')}
              onChange={e => updateExperience(i, 'bullets', e.target.value.split('\n'))}
              rows={4}
              className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        ))}
      </div>

      {/* Skills */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Skills</label>
        {resume.skills.map((group, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <input
              value={group.category}
              onChange={e => updateSkillGroup(i, 'category', e.target.value)}
              placeholder="Category"
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-40 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              value={group.skills.join(', ')}
              onChange={e => updateSkillGroup(i, 'skills', e.target.value.split(',').map(s => s.trim()))}
              placeholder="skill1, skill2, …"
              className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ))}
      </div>

      {/* Education */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Education</label>
        {resume.education.map((edu, i) => (
          <div key={i} className="grid grid-cols-2 gap-2 mb-2">
            <input
              value={edu.institution}
              onChange={e => {
                const ed = [...resume.education];
                ed[i] = { ...ed[i], institution: e.target.value };
                updateField('education', ed);
              }}
              placeholder="Institution"
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              value={edu.degree}
              onChange={e => {
                const ed = [...resume.education];
                ed[i] = { ...ed[i], degree: e.target.value };
                updateField('education', ed);
              }}
              placeholder="Degree"
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              value={edu.field}
              onChange={e => {
                const ed = [...resume.education];
                ed[i] = { ...ed[i], field: e.target.value };
                updateField('education', ed);
              }}
              placeholder="Field of Study"
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              value={edu.graduationDate}
              onChange={e => {
                const ed = [...resume.education];
                ed[i] = { ...ed[i], graduationDate: e.target.value };
                updateField('education', ed);
              }}
              placeholder="Graduation Date"
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ))}
      </div>

      {/* Certifications */}
      {resume.certifications.length > 0 && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Certifications (one per line)
          </label>
          <textarea
            value={resume.certifications.join('\n')}
            onChange={e => updateField('certifications', e.target.value.split('\n'))}
            rows={3}
            className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      )}

      {/* Languages */}
      {resume.languages.length > 0 && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Languages</label>
          {resume.languages.map((lang, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                value={lang.language}
                onChange={e => {
                  const langs = [...resume.languages];
                  langs[i] = { ...langs[i], language: e.target.value };
                  updateField('languages', langs);
                }}
                placeholder="Language"
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                value={lang.proficiency}
                onChange={e => {
                  const langs = [...resume.languages];
                  langs[i] = { ...langs[i], proficiency: e.target.value };
                  updateField('languages', langs);
                }}
                placeholder="Proficiency"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
