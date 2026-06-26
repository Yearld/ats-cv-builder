'use client';

import { useState } from 'react';

const STEPS = [
  {
    icon: '📄',
    title: 'Upload Your Resume',
    desc: 'Upload your current resume in PDF or DOCX format, or paste the text directly. We support any resume format.',
  },
  {
    icon: '💼',
    title: 'Paste the Job Description',
    desc: 'Copy the full job posting — requirements, responsibilities, and skills. The more detail, the better the optimization.',
  },
  {
    icon: '🤖',
    title: 'AI Optimization',
    desc: 'Our AI analyzes your resume against the job, identifies gaps, rewrites bullet points, and integrates ATS keywords — using only your real experience.',
  },
  {
    icon: '📊',
    title: 'Review Your Results',
    desc: 'See your ATS scores, gap analysis, pass-through chance, and the fully optimized resume across 5 tabs.',
  },
  {
    icon: '⬇️',
    title: 'Download & Apply',
    desc: 'Download your optimized resume as PDF or DOCX, ready to submit. Each optimization is tailored to that specific job.',
  },
];

interface TutorialProps {
  onClose: () => void;
  asPanel?: boolean;
}

export default function Tutorial({ onClose, asPanel }: TutorialProps) {
  const [step, setStep] = useState(0);

  if (asPanel) {
    return (
      <div className="space-y-4">
        {STEPS.map((s, i) => (
          <div key={i} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
            <span className="text-2xl">{s.icon}</span>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Step {i + 1}: {s.title}</p>
              <p className="text-gray-500 text-xs mt-0.5">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        {/* Progress dots */}
        <div className="flex gap-1.5 justify-center mb-6">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? 'w-6 bg-blue-600' : 'w-1.5 bg-gray-200'
              }`}
            />
          ))}
        </div>

        <div className="text-center mb-6">
          <div className="text-5xl mb-4">{current.icon}</div>
          <p className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">
            Step {step + 1} of {STEPS.length}
          </p>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{current.title}</h2>
          <p className="text-gray-500 text-sm leading-relaxed">{current.desc}</p>
        </div>

        <div className="flex gap-2">
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Back
            </button>
          )}
          <button
            onClick={() => isLast ? onClose() : setStep(s => s + 1)}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
          >
            {isLast ? "Let's Start!" : 'Next'}
          </button>
        </div>

        {!isLast && (
          <button onClick={onClose} className="w-full mt-3 text-xs text-gray-400 hover:text-gray-600">
            Skip tutorial
          </button>
        )}
      </div>
    </div>
  );
}
