import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Cloud,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export default function AuthShell({
  portal = 'student',
  icon: Icon,
  eyebrow,
  title,
  subtitle,
  sideEyebrow,
  sideTitle,
  sideAccent,
  sideDescription,
  sidePoints = [],
  children,
}) {
  const navigate = useNavigate();
  const isAdmin = portal === 'admin';

  const accent = isAdmin
    ? {
        iconTile: 'from-slate-900 via-indigo-900 to-violet-800',
        iconColor: 'text-cyan-300',
        chip: 'border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-700',
        bar: 'from-slate-900 via-violet-600 to-fuchsia-500',
        glowA: 'from-violet-500/25 to-fuchsia-400/10',
        dot: 'bg-fuchsia-500',
      }
    : {
        iconTile: 'from-indigo-500 via-violet-500 to-cyan-500',
        iconColor: 'text-white',
        chip: 'border-indigo-500/20 bg-indigo-500/10 text-indigo-700',
        bar: 'from-indigo-500 via-violet-500 to-cyan-400',
        glowA: 'from-indigo-500/25 to-cyan-400/10',
        dot: 'bg-cyan-500',
      };

  return (
    <div className="relative min-h-[100dvh] flex flex-col overflow-hidden">
      {/* header */}
      <header className="relative z-20 px-4 sm:px-6 pt-4 sm:pt-5">
        <div className="max-w-6xl mx-auto glass-header rounded-[1.35rem] px-3.5 sm:px-5 py-2.5 flex items-center justify-between gap-2 sm:gap-3">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 rounded-xl px-2 sm:px-2.5 py-2 text-xs font-bold text-slate-600 hover:text-indigo-700 hover:bg-white/60 transition-colors flex-shrink-0"
          >
            <span className="w-7 h-7 rounded-lg bg-white/70 border border-white/80 flex items-center justify-center shadow-sm">
              <ArrowLeft className="w-3.5 h-3.5 text-indigo-600" />
            </span>
            <span className="hidden sm:inline">Back to home</span>
          </button>

          <div className="flex items-center gap-2.5 min-w-0">
            <div className="ring-gradient flex-shrink-0">
              <img
                src="/logo.jpg"
                alt="AME logo"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover bg-white"
              />
            </div>
            <div className="min-w-0">
              <p className="font-display text-[11px] sm:text-[13px] font-extrabold text-ink truncate">
                <span className="sm:hidden">ADMISSIONS MADE EASY</span>
                <span className="hidden sm:inline">ADMISSIONS MADE EASY, LATUR</span>
              </p>
              <p className="hidden sm:block text-[9px] font-bold uppercase tracking-[0.16em] text-indigo-600">
                Student Document Portal · 2027
              </p>
            </div>
          </div>

          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.12em] text-emerald-700 flex-shrink-0">
            <span className="status-dot bg-emerald-500 live-dot" />
            Secure session
          </span>
        </div>
      </header>

      <main className="relative z-10 flex-1 px-4 sm:px-6 py-8 lg:py-12">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.02fr_0.98fr] gap-10 lg:gap-16 items-center">
          {/* narrative side */}
          <section className="hidden lg:block animate-rise">
            <span className="eyebrow">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              {sideEyebrow}
            </span>
            <h1 className="mt-5 font-display text-[3.2rem] xl:text-[3.7rem] leading-[1.03] font-black tracking-[-0.045em] text-ink">
              {sideTitle} <span className="aurora-text">{sideAccent}</span>
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-slate-600 font-medium">
              {sideDescription}
            </p>

            <div className="mt-7 space-y-3">
              {sidePoints.map((point, index) => (
                <div
                  key={point.title}
                  className="glass-card rounded-2xl px-4 py-3.5 flex items-start gap-3.5"
                >
                  <div
                    className={`w-9 h-9 rounded-xl bg-gradient-to-br ${accent.iconTile} text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/25`}
                  >
                    {index === 0 ? (
                      <Cloud className="w-4.5 h-4.5" />
                    ) : index === 1 ? (
                      <ShieldCheck className="w-4.5 h-4.5" />
                    ) : (
                      <CheckCircle2 className="w-4.5 h-4.5" />
                    )}
                  </div>
                  <div>
                    <p className="text-[13px] font-extrabold text-slate-900">{point.title}</p>
                    <p className="text-[11px] leading-relaxed text-slate-500 mt-0.5">
                      {point.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
              <LockKeyhole className="w-3.5 h-3.5 text-indigo-500" />
              Encrypted credentials · Live Firestore sync
            </div>
          </section>

          {/* form side */}
          <section className="w-full max-w-[430px] mx-auto animate-rise delay-1">
            <div className="relative">
              <div
                className={`absolute -inset-4 rounded-[2.6rem] bg-gradient-to-br ${accent.glowA} blur-3xl pointer-events-none`}
              />
              <div className="relative glass-panel rounded-[2rem] p-6 sm:p-8 overflow-hidden">
                <div
                  className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent.bar}`}
                />

                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${accent.iconTile} flex items-center justify-center shadow-xl shadow-indigo-500/25 flex-shrink-0`}
                  >
                    <Icon className={`w-6 h-6 ${accent.iconColor}`} />
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.12em] ${accent.chip}`}
                  >
                    <span className={`status-dot ${accent.dot}`} />
                    {isAdmin ? 'Authorized staff' : 'Candidate access'}
                  </span>
                </div>

                <div className="mt-5">
                  <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-indigo-600">
                    {eyebrow}
                  </p>
                  <h2 className="mt-1.5 font-display text-[1.7rem] leading-tight font-extrabold text-ink">
                    {title}
                  </h2>
                  <p className="text-xs leading-relaxed text-slate-500 mt-1.5">{subtitle}</p>
                </div>

                <div className="mt-5">{children}</div>
              </div>
            </div>

            <div className="mt-4 flex lg:hidden items-center justify-center gap-3 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-500">
              <span className="inline-flex items-center gap-1">
                <LockKeyhole className="w-3 h-3 text-indigo-500" />
                Encrypted
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="inline-flex items-center gap-1">
                <Cloud className="w-3 h-3 text-cyan-600" />
                Live Firestore sync
              </span>
            </div>

            <p className="mt-4 sm:mt-5 text-center text-[10px] font-medium text-slate-500">
              Need help? Call the admission office on{' '}
              <a href="tel:9422611661" className="font-extrabold text-indigo-700 hover:underline">
                94226 11661
              </a>
            </p>
          </section>
        </div>
      </main>

      <footer className="relative z-10 px-4 sm:px-6 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
        <div className="max-w-6xl mx-auto glass-header rounded-2xl px-4 py-3 text-center text-[10px] font-semibold text-slate-500">
          ADMISSIONS MADE EASY, LATUR · Admissions 2027
          <span className="mx-2 text-slate-300">|</span>
          <span className="inline-flex items-center gap-1">
            <ArrowRight className="w-3 h-3 text-indigo-500" />
            Paperless scrutiny, everywhere.
          </span>
        </div>
      </footer>
    </div>
  );
}
