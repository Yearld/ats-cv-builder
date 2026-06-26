'use client';

import { useState } from 'react';
import type { Lang } from '@/lib/i18n';

const STEPS: Record<Lang, { icon: string; title: string; desc: string }[]> = {
  en: [
    { icon: '🤖', title: 'What is ATS?', desc: 'ATS (Applicant Tracking System) is software used by 99% of large companies to automatically scan and filter resumes before a recruiter ever sees them. If your resume doesn\'t match the job keywords, it gets rejected instantly — no matter how qualified you are. This app helps you beat that filter.' },
    { icon: '📄', title: 'Upload Your Resume', desc: 'Upload your current resume in PDF or DOCX format, or paste the text directly. Our AI reads your real experience — we never invent or fabricate anything.' },
    { icon: '💼', title: 'Paste the Full Job Description', desc: 'Copy the entire job posting — requirements, responsibilities, skills, and nice-to-haves. The more detail you provide, the better the AI can tailor your resume to pass that specific ATS.' },
    { icon: '📊', title: 'Review Your Results', desc: 'See your first-stage screening chance, ATS keyword match, gap analysis, and your fully rewritten resume — all across 6 tabs. Edit any field before downloading.' },
    { icon: '⬇️', title: 'Download & Apply', desc: 'Download your ATS-optimized resume as PDF or DOCX and submit with confidence. Repeat for every job — each optimization is tailored to that specific position.' },
  ],
  es: [
    { icon: '🤖', title: '¿Qué es un ATS?', desc: 'El ATS (Sistema de Seguimiento de Candidatos) es el software que usa el 99% de las grandes empresas para filtrar currículums automáticamente antes de que un reclutador los vea. Si tu CV no coincide con las palabras clave, se rechaza al instante. Esta app te ayuda a superar ese filtro.' },
    { icon: '📄', title: 'Sube tu Currículum', desc: 'Sube tu CV en formato PDF o DOCX, o pega el texto directamente. La IA lee tu experiencia real — nunca inventamos nada.' },
    { icon: '💼', title: 'Pega la Descripción del Puesto', desc: 'Copia la oferta completa — requisitos, responsabilidades y habilidades. Cuanto más detalle proporciones, mejor la IA adaptará tu CV para pasar ese ATS.' },
    { icon: '📊', title: 'Revisa tus Resultados', desc: 'Ve tu probabilidad de pasar la primera etapa, coincidencia de palabras clave ATS, análisis de brechas y tu CV reescrito — todo en 6 pestañas.' },
    { icon: '⬇️', title: 'Descarga y Aplica', desc: 'Descarga tu CV optimizado en PDF o DOCX y postúlate con confianza. Repite para cada trabajo — cada optimización está adaptada a esa posición específica.' },
  ],
  fr: [
    { icon: '🤖', title: 'Qu\'est-ce qu\'un ATS?', desc: 'L\'ATS (Applicant Tracking System) est un logiciel utilisé par 99% des grandes entreprises pour filtrer automatiquement les CV avant qu\'un recruteur les voie. Si votre CV ne correspond pas aux mots-clés, il est rejeté instantanément. Cette app vous aide à passer ce filtre.' },
    { icon: '📄', title: 'Téléchargez votre CV', desc: 'Téléchargez votre CV en PDF ou DOCX, ou collez le texte directement. Notre IA lit votre vraie expérience — nous n\'inventons jamais rien.' },
    { icon: '💼', title: 'Collez la Description du Poste', desc: 'Copiez l\'offre complète — exigences, responsabilités et compétences. Plus vous fournissez de détails, mieux l\'IA peut adapter votre CV.' },
    { icon: '📊', title: 'Examinez vos Résultats', desc: 'Voyez votre chance de passer la première étape, la correspondance ATS, l\'analyse des écarts et votre CV réécrit — en 6 onglets.' },
    { icon: '⬇️', title: 'Téléchargez et Postulez', desc: 'Téléchargez votre CV optimisé en PDF ou DOCX. Répétez pour chaque emploi — chaque optimisation est adaptée à ce poste spécifique.' },
  ],
  ru: [
    { icon: '🤖', title: 'Что такое ATS?', desc: 'ATS (Applicant Tracking System) — это программа, которую используют 99% крупных компаний для автоматической сортировки резюме ещё до того, как их увидит рекрутёр. Если ваше резюме не совпадает с ключевыми словами вакансии — оно отклоняется мгновенно. Это приложение поможет вам пройти этот фильтр.' },
    { icon: '📄', title: 'Загрузите резюме', desc: 'Загрузите резюме в формате PDF или DOCX, либо вставьте текст вручную. AI читает ваш реальный опыт — мы никогда ничего не придумываем.' },
    { icon: '💼', title: 'Вставьте описание вакансии', desc: 'Скопируйте полный текст вакансии — требования, обязанности, навыки. Чем больше деталей, тем точнее AI адаптирует резюме под эту конкретную ATS-систему.' },
    { icon: '📊', title: 'Изучите результаты', desc: 'Узнайте шанс пройти первый этап, совпадение ключевых слов ATS, анализ пробелов и готовое переработанное резюме — в 6 вкладках.' },
    { icon: '⬇️', title: 'Скачайте и откликайтесь', desc: 'Скачайте оптимизированное резюме в PDF или DOCX и откликайтесь уверенно. Повторяйте для каждой вакансии — каждая оптимизация заточена под конкретную позицию.' },
  ],
};

const NAV: Record<Lang, { step: string; back: string; next: string; start: string; skip: string; of: string }> = {
  en: { step: 'Step', back: 'Back', next: 'Next', start: "Let's Start!", skip: 'Skip tutorial', of: 'of' },
  es: { step: 'Paso', back: 'Atrás', next: 'Siguiente', start: '¡Empecemos!', skip: 'Saltar tutorial', of: 'de' },
  fr: { step: 'Étape', back: 'Retour', next: 'Suivant', start: 'Commençons!', skip: 'Passer le tutoriel', of: 'sur' },
  ru: { step: 'Шаг', back: 'Назад', next: 'Далее', start: 'Начнём!', skip: 'Пропустить', of: 'из' },
};

interface TutorialProps { onClose: () => void; asPanel?: boolean; lang?: Lang; }

export default function Tutorial({ onClose, asPanel, lang = 'en' }: TutorialProps) {
  const [step, setStep] = useState(0);
  const steps = STEPS[lang];
  const nav = NAV[lang];

  if (asPanel) {
    return (
      <div className="space-y-4">
        {steps.map((s, i) => (
          <div key={i} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
            <span className="text-2xl">{s.icon}</span>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{nav.step} {i + 1}: {s.title}</p>
              <p className="text-gray-500 text-xs mt-0.5">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex gap-1.5 justify-center mb-6">
          {steps.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-blue-600' : 'w-1.5 bg-gray-200'}`} />
          ))}
        </div>
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">{current.icon}</div>
          <p className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">
            {nav.step} {step + 1} {nav.of} {steps.length}
          </p>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{current.title}</h2>
          <p className="text-gray-500 text-sm leading-relaxed">{current.desc}</p>
        </div>
        <div className="flex gap-2">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
              {nav.back}
            </button>
          )}
          <button onClick={() => isLast ? onClose() : setStep(s => s + 1)}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold">
            {isLast ? nav.start : nav.next}
          </button>
        </div>
        {!isLast && (
          <button onClick={onClose} className="w-full mt-3 text-xs text-gray-400 hover:text-gray-600">
            {nav.skip}
          </button>
        )}
      </div>
    </div>
  );
}
