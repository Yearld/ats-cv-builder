'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PipelineResult, OptimizedResume, ExperienceEntry, SkillGroup } from '@/types/cv';
import Sidebar from '@/components/Sidebar';
import Tutorial from '@/components/Tutorial';
import { t, type Lang } from '@/lib/i18n';

type Tab = 'chance' | 'analysis' | 'ats' | 'gap' | 'resume' | 'scores';

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('chance');
  const [editableResume, setEditableResume] = useState<OptimizedResume | null>(null);
  const [exporting, setExporting] = useState<'pdf' | 'docx' | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [lang, setLang] = useState<Lang>('en');

  useEffect(() => {
    const stored = sessionStorage.getItem('pipelineResult');
    if (!stored) { router.push('/'); return; }
    const parsed: PipelineResult = JSON.parse(stored);
    setResult(parsed);
    setEditableResume(JSON.parse(JSON.stringify(parsed.optimizedResume)));
    const storedLang = (sessionStorage.getItem('lang') || localStorage.getItem('lang') || 'en') as Lang;
    if (['en', 'es', 'fr', 'ru'].includes(storedLang)) setLang(storedLang);
  }, [router]);

  const tr = t[lang];

  async function handleExport(format: 'pdf' | 'docx') {
    if (!editableResume) return;
    setExporting(format);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? ''}/api/export`, {
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

  const { resumeAnalysis, jobAnalysis, gapAnalysis, scores, passingChance } = result;

  const verdictConfig = {
    Strong: { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', bar: 'bg-green-500', emoji: '🚀' },
    Good:   { color: 'text-blue-600',  bg: 'bg-blue-50',  border: 'border-blue-200',  bar: 'bg-blue-500',  emoji: '👍' },
    Fair:   { color: 'text-yellow-600',bg: 'bg-yellow-50',border: 'border-yellow-200',bar: 'bg-yellow-500',emoji: '⚠️' },
    Weak:   { color: 'text-red-600',   bg: 'bg-red-50',   border: 'border-red-200',   bar: 'bg-red-500',   emoji: '❌' },
  };
  const vc = verdictConfig[passingChance?.verdict ?? 'Fair'];

  const tabs: { id: Tab; label: string }[] = [
    { id: 'chance',   label: tr.tabChances },
    { id: 'analysis', label: tr.tabAnalysis },
    { id: 'ats',      label: tr.tabATS },
    { id: 'gap',      label: tr.tabGap },
    { id: 'resume',   label: tr.tabResume },
    { id: 'scores',   label: tr.tabScores },
  ];

  return (
    <>
      <main className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setSidebarOpen(true)}
              className="w-9 h-9 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center justify-center hover:bg-gray-50 flex-shrink-0">
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-900">{tr.resumeOptimized}</h1>
              <p className="text-gray-500 text-xs truncate">
                {jobAnalysis.jobTitle}{jobAnalysis.industry && ` · ${jobAnalysis.industry}`}{jobAnalysis.seniorityLevel && ` · ${jobAnalysis.seniorityLevel}`}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => handleExport('pdf')} disabled={!!exporting}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-medium px-3 py-2 rounded-lg">
                {exporting === 'pdf' ? tr.generating : 'PDF'}
              </button>
              <button onClick={() => handleExport('docx')} disabled={!!exporting}
                className="bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400 text-white text-xs font-medium px-3 py-2 rounded-lg">
                {exporting === 'docx' ? tr.generating : 'DOCX'}
              </button>
              <button onClick={() => router.push('/')}
                className="border border-gray-300 text-gray-600 hover:bg-gray-100 text-xs font-medium px-3 py-2 rounded-lg">
                {tr.newResume}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 overflow-x-auto">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-max py-2 px-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">

            {/* Chances tab */}
            {activeTab === 'chance' && passingChance && (
              <div>
                <h2 className="text-lg font-semibold mb-4">{tr.chancesTitle}</h2>
                <div className={`rounded-2xl border ${vc.bg} ${vc.border} p-6 mb-6 text-center`}>
                  <div className="text-5xl mb-2">{vc.emoji}</div>
                  <div className={`text-6xl font-bold ${vc.color} mb-1`}>{passingChance.percentage}%</div>
                  <div className={`text-lg font-semibold ${vc.color} mb-3`}>{passingChance.verdict}</div>
                  <div className="w-full bg-white/60 rounded-full h-3 mb-4 max-w-xs mx-auto">
                    <div className={`${vc.bar} rounded-full h-3 transition-all`} style={{ width: `${passingChance.percentage}%` }} />
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed max-w-md mx-auto">{passingChance.summary}</p>
                </div>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <Section title={tr.keyStrengths} items={passingChance.keyStrengths} color="green" />
                  <Section title={tr.keyRisks} items={passingChance.keyRisks} color="red" />
                </div>
                {passingChance.tips.length > 0 && (
                  <Section title={tr.tipsTitle} items={passingChance.tips} color="blue" />
                )}
              </div>
            )}

            {/* Analysis tab */}
            {activeTab === 'analysis' && (
              <div>
                <h2 className="text-lg font-semibold mb-4">{tr.tabAnalysis}</h2>
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
                          <div className="bg-blue-500 rounded-full h-1.5" style={{ width: `${(score as number) * 10}%` }} />
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
                <h2 className="text-lg font-semibold mb-4">{tr.tabATS}</h2>
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
                <h2 className="text-lg font-semibold mb-4">{tr.tabGap}</h2>
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
                <h2 className="text-lg font-semibold mb-1">{tr.tabResume}</h2>
                <p className="text-xs text-gray-400 mb-4">You can edit any field below before downloading.</p>
                {editableResume.missingInfo && editableResume.missingInfo.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                    <p className="text-sm font-semibold text-amber-800 mb-1">Missing Information</p>
                    <p className="text-xs text-amber-700 mb-2">Add this to improve results:</p>
                    <ul className="space-y-1">
                      {editableResume.missingInfo.map((m, i) => (
                        <li key={i} className="text-sm text-amber-800 flex gap-2"><span className="text-amber-400">!</span>{m}</li>
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
                <h2 className="text-lg font-semibold mb-4">{tr.tabScores}</h2>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {[
                    ['ATS Compatibility', scores.atsCompatibility],
                    ['Recruiter Appeal', scores.recruiterAppeal],
                    ['Overall Quality', scores.overallQuality],
                    ['Competitiveness', scores.competitiveness],
                  ].map(([label, score]) => (
                    <div key={label as string} className="bg-gray-50 rounded-2xl p-5 text-center">
                      <div className={`text-4xl font-bold mb-1 ${
                        (score as number) >= 80 ? 'text-green-600' : (score as number) >= 60 ? 'text-yellow-600' : 'text-red-500'
                      }`}>{score}</div>
                      <div className="text-xs text-gray-500 font-medium">{label}</div>
                      <div className="mt-2 bg-gray-200 rounded-full h-1.5">
                        <div className={`rounded-full h-1.5 ${
                          (score as number) >= 80 ? 'bg-green-500' : (score as number) >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`} style={{ width: `${score}%` }} />
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

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} lang={lang} onShowTutorial={() => setShowTutorial(true)} />
      {showTutorial && <Tutorial onClose={() => setShowTutorial(false)} lang={lang} />}
    </>
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
      {items.length === 0 ? <p className="text-xs opacity-60">—</p> : (
        <ul className="space-y-1">
          {items.map((item, i) => (
            <li key={i} className="text-sm flex gap-2"><span className="opacity-40 mt-0.5">•</span>{item}</li>
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
        <span key={i} className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[color] ?? colors.gray}`}>{item}</span>
      ))}
    </div>
  );
}

function ResumeEditor({ resume, onChange }: { resume: OptimizedResume; onChange: (r: OptimizedResume) => void }) {
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
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Professional Summary</label>
        <textarea value={resume.professionalSummary} onChange={e => updateField('professionalSummary', e.target.value)}
          rows={4} className="w-full border border-gray-200 rounded-lg p-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Experience</label>
        {resume.experience.map((exp, i) => (
          <div key={i} className="border border-gray-200 rounded-xl p-4 mb-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {(['title', 'company', 'startDate', 'endDate'] as const).map(f => (
                <input key={f} value={exp[f]} onChange={e => updateExperience(i, f, e.target.value)}
                  placeholder={f} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              ))}
            </div>
            <label className="text-xs text-gray-400">Bullets (one per line)</label>
            <textarea value={exp.bullets.join('\n')} onChange={e => updateExperience(i, 'bullets', e.target.value.split('\n'))}
              rows={4} className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
        ))}
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Skills</label>
        {resume.skills.map((group, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <input value={group.category} onChange={e => updateSkillGroup(i, 'category', e.target.value)}
              placeholder="Category" className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-40 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input value={group.skills.join(', ')} onChange={e => updateSkillGroup(i, 'skills', e.target.value.split(',').map(s => s.trim()))}
              placeholder="skill1, skill2, …" className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        ))}
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Education</label>
        {resume.education.map((edu, i) => (
          <div key={i} className="grid grid-cols-2 gap-2 mb-2">
            {(['institution', 'degree', 'field', 'graduationDate'] as const).map(f => (
              <input key={f} value={edu[f]} onChange={e => {
                const ed = [...resume.education]; ed[i] = { ...ed[i], [f]: e.target.value }; updateField('education', ed);
              }} placeholder={f} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            ))}
          </div>
        ))}
      </div>

      {resume.certifications.length > 0 && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Certifications (one per line)</label>
          <textarea value={resume.certifications.join('\n')} onChange={e => updateField('certifications', e.target.value.split('\n'))}
            rows={3} className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>
      )}

      {resume.languages.length > 0 && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Languages</label>
          {resume.languages.map((lang, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input value={lang.language} onChange={e => { const l = [...resume.languages]; l[i] = { ...l[i], language: e.target.value }; updateField('languages', l); }}
                placeholder="Language" className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input value={lang.proficiency} onChange={e => { const l = [...resume.languages]; l[i] = { ...l[i], proficiency: e.target.value }; updateField('languages', l); }}
                placeholder="Proficiency" className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
