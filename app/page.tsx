'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Tutorial from '@/components/Tutorial';
import { t, LANGUAGES, type Lang } from '@/lib/i18n';

const MAX_EXTRA_FILES = 3;
const ACCEPT = '.pdf,.docx,.png,.jpg,.jpeg';

export default function HomePage() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>('en');
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const [inputMode, setInputMode] = useState<'file' | 'text'>('file');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [extraFiles, setExtraFiles] = useState<{ name: string; text: string }[]>([]);
  const [extraLoading, setExtraLoading] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const extraRef = useRef<HTMLInputElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const tr = t[lang];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    const storedLang = localStorage.getItem('lang') as Lang | null;
    if (storedLang && ['en', 'es', 'fr', 'ru'].includes(storedLang)) setLang(storedLang);
    if (!localStorage.getItem('tutorialSeen')) setShowTutorial(true);
  }, []);

  function changeLang(l: Lang) {
    setLang(l);
    localStorage.setItem('lang', l);
  }

  function closeTutorial() {
    localStorage.setItem('tutorialSeen', '1');
    setShowTutorial(false);
  }

  async function parseFile(file: File): Promise<string> {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? ''}/api/parse`, { method: 'POST', body: fd });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.text;
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError('');
    try {
      const text = await parseFile(file);
      setResumeText(text);
    } catch (err) {
      setError(`Failed to parse file: ${err instanceof Error ? err.message : 'Network error'}`);
    }
  }

  async function handleExtraFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const remaining = MAX_EXTRA_FILES - extraFiles.length;
    const toProcess = files.slice(0, remaining);
    setExtraLoading(true);
    setError('');
    try {
      const results = await Promise.all(toProcess.map(async f => ({
        name: f.name,
        text: await parseFile(f),
      })));
      setExtraFiles(prev => [...prev, ...results]);
    } catch (err) {
      setError(`Failed to parse additional file: ${err instanceof Error ? err.message : 'Network error'}`);
    } finally {
      setExtraLoading(false);
      if (extraRef.current) extraRef.current.value = '';
    }
  }

  function removeExtra(idx: number) {
    setExtraFiles(prev => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resumeText.trim()) { setError(tr.errorNoResume); return; }
    if (!jobDescription.trim()) { setError(tr.errorNoJob); return; }
    setLoading(true);
    setError('');
    try {
      const additionalContext = extraFiles.map(f => `[${f.name}]\n${f.text}`).join('\n\n');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? ''}/api/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jobDescription, language: lang, additionalContext }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      try {
        const usage = JSON.parse(localStorage.getItem('usage') || '{"total":0,"used":0}');
        usage.used += 1;
        localStorage.setItem('usage', JSON.stringify(usage));
      } catch {}
      sessionStorage.setItem('pipelineResult', JSON.stringify(data));
      sessionStorage.setItem('lang', lang);
      router.push('/result');
    } catch {
      setError(tr.errorUnexpected);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        {/* Top bar */}
        <div className="fixed top-4 left-4 right-4 z-30 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-10 h-10 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center justify-center hover:bg-gray-50"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Language selector */}
          <div ref={langRef} className="relative">
            <button
              onClick={() => setLangOpen(o => !o)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white rounded-xl shadow-sm border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {lang.toUpperCase()}
              <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${langOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {langOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50 w-36">
                {LANGUAGES.map(l => (
                  <button
                    key={l.code}
                    onClick={() => { changeLang(l.code); setLangOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors text-left ${
                      lang === l.code ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span>{l.flag}</span>
                    <span>{l.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="w-full max-w-2xl mt-16">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">{tr.appName}</h1>
          <p className="text-gray-500 text-center mb-8 text-sm">{tr.appTagline}</p>

          <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            {/* Resume */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{tr.yourResume}</label>
              <div className="flex gap-2 mb-3">
                <button type="button" onClick={() => setInputMode('file')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${inputMode === 'file' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {tr.uploadFile}
                </button>
                <button type="button" onClick={() => setInputMode('text')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${inputMode === 'text' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {tr.pasteText}
                </button>
              </div>

              {inputMode === 'file' ? (
                <div onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                  <input ref={fileRef} type="file" accept={ACCEPT} className="hidden" onChange={handleFileUpload} />
                  {fileName ? (
                    <p className="text-blue-600 font-medium">{fileName}</p>
                  ) : (
                    <>
                      <p className="text-gray-500 text-sm">{tr.uploadHint}</p>
                      <p className="text-gray-400 text-xs mt-1">{tr.uploadSize}</p>
                    </>
                  )}
                </div>
              ) : (
                <textarea value={resumeText} onChange={e => setResumeText(e.target.value)}
                  placeholder={tr.pasteResumePlaceholder} rows={8}
                  className="w-full border border-gray-300 rounded-xl p-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              )}
            </div>

            {/* Job description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">{tr.jobDescription}</label>
              <p className="text-xs text-gray-400 mb-2">{tr.jobDescHint}</p>
              <textarea value={jobDescription} onChange={e => setJobDescription(e.target.value)}
                placeholder={tr.jobDescPlaceholder} rows={8}
                className="w-full border border-gray-300 rounded-xl p-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>

            {/* Additional files */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">{tr.additionalFiles}</label>
              <p className="text-xs text-gray-400 mb-3">{tr.additionalFilesHint}</p>

              {extraFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 mb-2">
                  <span className="text-sm flex-1 truncate text-gray-700">{f.name}</span>
                  <button type="button" onClick={() => removeExtra(i)}
                    className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}

              {extraFiles.length < MAX_EXTRA_FILES && (
                <button type="button" onClick={() => extraRef.current?.click()}
                  disabled={extraLoading}
                  className="w-full border-2 border-dashed border-gray-200 rounded-xl py-3 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                  <input ref={extraRef} type="file" accept={ACCEPT} multiple className="hidden" onChange={handleExtraFiles} />
                  {extraLoading ? (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  )}
                  {tr.addFile} ({extraFiles.length}/{MAX_EXTRA_FILES})
                </button>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">{error}</div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-xl transition-colors">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  {tr.optimizing}
                </span>
              ) : tr.optimizeBtn}
            </button>
          </form>
        </div>
      </main>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} lang={lang} onShowTutorial={() => setShowTutorial(true)} />
      {showTutorial && <Tutorial onClose={closeTutorial} lang={lang} />}
    </>
  );
}
