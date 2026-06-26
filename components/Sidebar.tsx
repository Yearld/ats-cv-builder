'use client';

import { useEffect, useState } from 'react';
import Tutorial from './Tutorial';

const LINKEDIN_URL = 'https://linkedin.com/company/ats-cv-builder'; // replace after creating

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

interface UsageStats {
  total: number;
  used: number;
}

function getUsage(): UsageStats {
  if (typeof window === 'undefined') return { total: 0, used: 0 };
  try {
    return JSON.parse(localStorage.getItem('usage') || '{"total":0,"used":0}');
  } catch {
    return { total: 0, used: 0 };
  }
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const [activeSection, setActiveSection] = useState<'menu' | 'tutorial' | 'about' | 'credits'>('menu');
  const [usage, setUsage] = useState<UsageStats>({ total: 0, used: 0 });
  const [showTutorialPopup, setShowTutorialPopup] = useState(false);

  useEffect(() => {
    if (open) {
      setUsage(getUsage());
      setActiveSection('menu');
    }
  }, [open]);

  if (!open) return null;

  const remaining = Math.max(0, usage.total - usage.used);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed left-0 top-0 bottom-0 z-50 w-72 bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          {activeSection === 'menu' ? (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">CV</span>
              </div>
              <span className="font-bold text-gray-900">ATS CV Builder</span>
            </div>
          ) : (
            <button onClick={() => setActiveSection('menu')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">Back</span>
            </button>
          )}
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">

          {/* Main menu */}
          {activeSection === 'menu' && (
            <div className="space-y-1">
              {[
                { id: 'tutorial', icon: '🎓', label: 'How to Use', sub: 'Step-by-step guide' },
                { id: 'credits', icon: '💳', label: 'My Optimizations', sub: `${remaining} remaining` },
                { id: 'about', icon: 'ℹ️', label: 'About', sub: 'App info & contacts' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id as typeof activeSection)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
                >
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                    <p className="text-xs text-gray-400">{item.sub}</p>
                  </div>
                  <svg className="w-4 h-4 text-gray-300 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          )}

          {/* Tutorial panel */}
          {activeSection === 'tutorial' && (
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-1">How to Use</h2>
              <p className="text-xs text-gray-400 mb-4">Follow these steps to optimize your resume</p>
              <Tutorial asPanel onClose={() => {}} />
              <button
                onClick={() => { onClose(); setShowTutorialPopup(true); }}
                className="mt-4 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl"
              >
                Start Interactive Tutorial
              </button>
            </div>
          )}

          {/* Credits / Optimizations */}
          {activeSection === 'credits' && (
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-1">My Optimizations</h2>
              <p className="text-xs text-gray-400 mb-4">Track your resume optimization credits</p>

              <div className="bg-blue-50 rounded-2xl p-4 mb-4 text-center">
                <p className="text-4xl font-bold text-blue-600">{remaining}</p>
                <p className="text-sm text-blue-700 mt-1">optimizations remaining</p>
                <div className="flex justify-between text-xs text-blue-500 mt-3">
                  <span>Used: {usage.used}</span>
                  <span>Total purchased: {usage.total}</span>
                </div>
              </div>

              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Buy more</p>
              {[
                { label: '1 Optimization', price: '$1', optimizations: 1 },
                { label: '5 Optimizations', price: '$4', optimizations: 5, badge: 'Save 20%' },
                { label: '10 Optimizations', price: '$8', optimizations: 10, badge: 'Save 20%' },
              ].map(pkg => (
                <div key={pkg.label} className="flex items-center justify-between p-3 border border-gray-200 rounded-xl mb-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{pkg.label}</p>
                    {pkg.badge && (
                      <span className="text-xs text-green-600 font-medium">{pkg.badge}</span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{pkg.price}</p>
                    <button className="text-xs text-blue-600 font-medium mt-0.5">
                      Buy (coming soon)
                    </button>
                  </div>
                </div>
              ))}
              <p className="text-xs text-gray-400 text-center mt-3">
                In-app purchases via Google Play coming soon
              </p>
            </div>
          )}

          {/* About */}
          {activeSection === 'about' && (
            <div>
              <div className="text-center mb-5">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-white text-2xl font-bold">CV</span>
                </div>
                <h2 className="text-lg font-bold text-gray-900">ATS CV Builder</h2>
                <p className="text-xs text-gray-400">Version 1.0.0</p>
              </div>

              <p className="text-sm text-gray-600 leading-relaxed mb-5">
                AI-powered resume optimizer that tailors your resume to any job description — 100% truthful, ATS-optimized, and recruiter-ready.
              </p>

              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Contact & Social</p>
              <div className="space-y-2">
                <a
                  href="mailto:erlanlukpanov94@gmail.com"
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                >
                  <span className="text-lg">✉️</span>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">Email</p>
                    <p className="text-xs text-gray-500">erlanlukpanov94@gmail.com</p>
                  </div>
                </a>
                <a
                  href={LINKEDIN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                >
                  <span className="text-lg">💼</span>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">LinkedIn</p>
                    <p className="text-xs text-gray-500">ATS CV Builder</p>
                  </div>
                </a>
              </div>

              <p className="text-xs text-gray-300 text-center mt-6">
                © 2026 ATS CV Builder. All rights reserved.
              </p>
            </div>
          )}
        </div>
      </div>

      {showTutorialPopup && (
        <Tutorial onClose={() => setShowTutorialPopup(false)} />
      )}
    </>
  );
}
