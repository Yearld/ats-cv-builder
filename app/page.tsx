'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Tutorial from '@/components/Tutorial';

export default function HomePage() {
  const router = useRouter();
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const [inputMode, setInputMode] = useState<'file' | 'text'>('file');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const seen = localStorage.getItem('tutorialSeen');
    if (!seen) setShowTutorial(true);
  }, []);

  function closeTutorial() {
    localStorage.setItem('tutorialSeen', '1');
    setShowTutorial(false);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError('');

    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? ''}/api/parse`, { method: 'POST', body: fd });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setResumeText(data.text);
    } catch (err) {
      setError(`Failed to parse file: ${err instanceof Error ? err.message : 'Network error'}`);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resumeText.trim()) { setError('Please provide your resume.'); return; }
    if (!jobDescription.trim()) { setError('Please provide the job description.'); return; }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? ''}/api/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jobDescription }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }

      try {
        const usage = JSON.parse(localStorage.getItem('usage') || '{"total":0,"used":0}');
        usage.used += 1;
        localStorage.setItem('usage', JSON.stringify(usage));
      } catch {}

      sessionStorage.setItem('pipelineResult', JSON.stringify(data));
      sessionStorage.setItem('resumeText', resumeText);
      router.push('/result');
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed top-4 left-4 z-30 w-10 h-10 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="w-full max-w-2xl">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">ATS CV Builder</h1>
          <p className="text-gray-500 text-center mb-8 text-sm">
            Transform your resume for any job — 100% truthful, ATS-optimized.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Your Resume</label>
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setInputMode('file')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    inputMode === 'file' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('text')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    inputMode === 'text' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Paste Text
                </button>
              </div>

              {inputMode === 'file' ? (
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <input ref={fileRef} type="file" accept=".pdf,.docx" className="hidden" onChange={handleFileUpload} />
                  {fileName ? (
                    <p className="text-blue-600 font-medium">{fileName}</p>
                  ) : (
                    <>
                      <p className="text-gray-500 text-sm">Click to upload PDF or DOCX</p>
                      <p className="text-gray-400 text-xs mt-1">Max file size: 10 MB</p>
                    </>
                  )}
                </div>
              ) : (
                <textarea
                  value={resumeText}
                  onChange={e => setResumeText(e.target.value)}
                  placeholder="Paste your resume text here..."
                  rows={8}
                  className="w-full border border-gray-300 rounded-xl p-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Job Description</label>
              <p className="text-xs text-gray-400 mb-2">Paste the full job posting — requirements, responsibilities, and skills for best results.</p>
              <textarea
                value={jobDescription}
                onChange={e => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here — include all requirements, responsibilities, and desired skills..."
                rows={8}
                className="w-full border border-gray-300 rounded-xl p-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Optimizing your resume…
                </span>
              ) : (
                'Optimize Resume'
              )}
            </button>
          </form>
        </div>
      </main>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {showTutorial && <Tutorial onClose={closeTutorial} />}
    </>
  );
}
