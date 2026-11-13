import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Cloud,
  Files,
  GraduationCap,
  LockKeyhole,
  Phone,
  Radio,
  ScanLine,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

const STATS = [
  { value: '100%', label: 'Paperless process' },
  { value: 'Live', label: 'Cloud sync' },
  { value: 'AES', label: 'Hashed credentials' },
];

const FEATURES = [
  {
    icon: Cloud,
    title: 'Cloud-synced instantly',
    text: 'A document uploaded on a phone appears on the scrutiny desk in seconds.',
    tint: 'from-sky-500/20 to-cyan-400/10',
    iconTint: 'from-sky-500 to-cyan-500',
  },
  {
    icon: ScanLine,
    title: 'Smart document checklist',
    text: 'Category-aware requirements for OPEN, OBC, SC, ST, EWS and more.',
    tint: 'from-indigo-500/20 to-violet-400/10',
    iconTint: 'from-indigo-500 to-violet-500',
  },
  {
    icon: Files,
    title: 'One-click ZIP exports',
    text: 'Download a candidate’s complete files with official, office-ready names.',
    tint: 'from-fuchsia-500/20 to-pink-400/10',
    iconTint: 'from-fuchsia-500 to-pink-500',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-[100dvh] flex flex-col overflow-hidden selection:bg-indigo-500/25">
      {/* floating header */}
      <header className="relative z-20 px-4 sm:px-6 pt-4 sm:pt-5">
        <div className="max-w-7xl mx-auto glass-header rounded-[1.35rem] px-3.5 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="ring-gradient flex-shrink-0">
              <img
                src="/logo.jpg"
                alt="AME Logo"
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover bg-white"
              />
            </div>
            <div className="min-w-0">
              <p className="font-display font-extrabold text-ink tracking-tight text-[11px] sm:text-[15px] truncate">
                <span className="sm:hidden">ADMISSIONS MADE EASY</span>
                <span className="hidden sm:inline">ADMISSIONS MADE EASY, LATUR</span>
              </p>
              <p className="text-[8px] sm:text-[11px] text-indigo-700 font-bold tracking-[0.1em] sm:tracking-[0.16em] uppercase truncate whitespace-nowrap">
                <span className="sm:hidden">STUDENT PORTAL · 2027</span>
                <span className="hidden sm:inline">Student Document Portal · 2027</span>
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-emerald-700">
              <span className="status-dot bg-emerald-500 live-dot" />
              Admission session live
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/50 px-3 py-1.5 text-[10px] font-bold text-slate-600">
              <LockKeyhole className="w-3 h-3 text-indigo-500" />
              Secure cloud
            </span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href="tel:9422611661"
              className="inline-flex btn-soft !py-2 !px-3 sm:!px-3.5"
              aria-label="Call admission helpline"
            >
              <Phone className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden lg:inline">Helpline: 94226 11661</span>
            </a>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 px-4 sm:px-6 py-5 sm:py-10 lg:py-16">
        <div className="max-w-7xl mx-auto flex flex-col">
          <div className="order-2 lg:order-none mt-8 lg:mt-0 grid lg:grid-cols-[1.06fr_0.94fr] gap-10 lg:gap-14 items-center">
            {/* hero copy */}
            <section className="animate-rise">
              <span className="eyebrow">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                Official admission scrutiny · 2027
              </span>

              <h1 className="mt-4 sm:mt-5 text-[2.3rem] leading-[1.03] sm:text-6xl xl:text-[4.4rem] font-black tracking-[-0.045em] text-ink">
                Admission documents,
                <br />
                made <span className="aurora-text">crystal clear.</span>
              </h1>

              <p className="mt-4 sm:mt-5 max-w-xl text-[13px] sm:text-[15px] leading-relaxed text-slate-600 font-medium">
                One luminous workspace for students and the scrutiny committee. Upload
                certificates, track verification in real time, and keep every decision in
                sync across every device.
              </p>

              <div className="mt-5 sm:mt-7 flex w-full sm:w-auto items-center justify-center sm:justify-start gap-2 rounded-2xl sm:rounded-full border border-white/80 bg-white/45 px-3.5 py-2.5 text-center text-[10px] sm:text-[11px] font-bold text-slate-600 backdrop-blur">
                <ArrowRight className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                Pick a portal to continue — student or admin office
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2 sm:mt-6 sm:flex sm:flex-wrap sm:items-baseline sm:gap-x-7 sm:gap-y-3">
                {STATS.map((s) => (
                  <div
                    key={s.label}
                    className="flex flex-col gap-0.5 rounded-xl border border-white/70 bg-white/35 px-2.5 py-2 backdrop-blur sm:flex-row sm:items-baseline sm:gap-2 sm:border-0 sm:bg-transparent sm:p-0"
                  >
                    <span className="font-display text-lg sm:text-xl font-extrabold aurora-text leading-none">
                      {s.value}
                    </span>
                    <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.1em] sm:tracking-[0.13em] text-slate-500 leading-tight">
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* floating glass application preview — desktop only so the
                portal cards stay above the fold on phones */}
            <section className="relative animate-rise delay-2 hidden lg:block">
              <div className="absolute -top-6 -right-2 sm:right-4 z-20 animate-float">
                <div className="glass-card rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                    <BadgeCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                      Scrutiny status
                    </p>
                    <p className="text-[11px] font-extrabold text-slate-900">Approved live</p>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-5 left-1 sm:-left-4 z-20 animate-float-slow">
                <div className="glass-card rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-sky-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30">
                    <Radio className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                      Cloud sync
                    </p>
                    <p className="text-[11px] font-extrabold text-slate-900">All devices · 2s ago</p>
                  </div>
                </div>
              </div>

              <div className="relative mx-auto max-w-[430px]">
                <div className="absolute -inset-4 rounded-[2.4rem] bg-gradient-to-br from-indigo-500/20 via-cyan-400/10 to-pink-400/20 blur-2xl" />
                <div className="relative glass-panel rounded-[2rem] p-5 sm:p-6 glass-sheen">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                        <ScanLine className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-indigo-600">
                          Application review
                        </p>
                        <p className="text-sm font-extrabold text-slate-900">2027 / 00184</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider text-emerald-700">
                      <span className="status-dot bg-emerald-500" /> Verified
                    </span>
                  </div>

                  <div className="my-5 rounded-2xl glass-soft p-4">
                    <div className="flex items-center gap-4">
                      <div
                        className="relative w-[76px] h-[76px] rounded-full flex-shrink-0"
                        style={{
                          background:
                            'conic-gradient(#4f46e5 0% 42%, #06b6d4 42% 74%, #10b981 74% 88%, rgba(148,163,184,0.18) 88% 100%)',
                        }}
                      >
                        <div className="absolute inset-[7px] rounded-full bg-white/85 backdrop-blur flex flex-col items-center justify-center">
                          <span className="font-display text-lg font-extrabold text-slate-900 leading-none">
                            88%
                          </span>
                          <span className="text-[7px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">
                            Complete
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-extrabold text-slate-900 truncate">
                          Aarav S. Deshmukh
                        </p>
                        <p className="text-[10px] font-medium text-slate-500 mt-0.5">
                          OPEN category · 12 documents
                        </p>
                        <div className="mt-2.5 grid grid-cols-3 gap-1.5 text-center">
                          {[
                            ['8', 'Correct'],
                            ['2', 'Review'],
                            ['2', 'Pending'],
                          ].map(([n, l]) => (
                            <div key={l} className="rounded-lg bg-white/55 border border-white/70 py-1">
                              <p className="text-[11px] font-extrabold text-slate-800">{n}</p>
                              <p className="text-[7px] font-bold uppercase tracking-wide text-slate-500">
                                {l}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {[
                      { icon: CheckCircle2, label: 'SSC (10th) Marksheet', meta: 'Approved', tone: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/15' },
                      { icon: CheckCircle2, label: 'HSC (12th) Marksheet', meta: 'Approved', tone: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/15' },
                      { icon: Radio, label: 'Domicile Certificate', meta: 'In review', tone: 'text-amber-600 bg-amber-500/10 border-amber-500/15' },
                    ].map((row) => (
                      <div
                        key={row.label}
                        className="flex items-center gap-2.5 rounded-xl border border-white/70 bg-white/45 px-3 py-2.5"
                      >
                        <row.icon className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                        <span className="text-[11px] font-bold text-slate-700 flex-1 truncate">
                          {row.label}
                        </span>
                        <span
                          className={`text-[8px] font-extrabold uppercase tracking-wider rounded-full border px-2 py-0.5 ${row.tone}`}
                        >
                          {row.meta}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* portal cards — the single login entry point. On phones they come
              first so both options are visible without scrolling. */}
          <div className="order-1 lg:order-none relative mt-1 sm:mt-12 lg:mt-20 max-w-5xl mx-auto w-full">
            <p className="lg:hidden text-center text-[10px] font-extrabold uppercase tracking-[0.18em] text-indigo-600 mb-3">
              Choose your portal
            </p>
            <div className="absolute -inset-8 rounded-[3rem] bg-gradient-to-r from-indigo-500/25 via-cyan-400/20 to-fuchsia-500/25 blur-3xl pointer-events-none" />
            <div className="relative grid md:grid-cols-2 gap-5 lg:gap-6">
            <button
              onClick={() => navigate('/student/login')}
              className="glass-panel glass-card-hover glass-sheen group rounded-[1.75rem] p-5 sm:p-7 text-left relative overflow-hidden active:scale-[0.995]"
            >
              <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full bg-gradient-to-br from-indigo-500/20 to-cyan-400/10 blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
              <div className="flex items-start justify-between gap-4">
                <div className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-500 text-white flex items-center justify-center shadow-xl shadow-indigo-500/30 group-hover:scale-105 transition-transform">
                  <GraduationCap className="w-7 h-7" />
                </div>
                <span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-[8px] sm:text-[9px] font-extrabold uppercase tracking-[0.13em] text-indigo-700">
                  Candidates &amp; parents
                </span>
              </div>
              <h2 className="mt-4 sm:mt-5 font-display text-xl sm:text-2xl font-extrabold text-ink">
                Student portal
              </h2>
              <p className="mt-1.5 text-[12px] sm:text-[13px] leading-relaxed text-slate-600">
                Sign in with your registration number and mobile number. Upload the correct
                certificates, watch the scrutiny progress live, and respond to any corrections.
              </p>
              <div className="mt-4 sm:mt-5 flex items-center justify-between border-t border-white/60 pt-4">
                <span className="text-[11px] sm:text-xs font-extrabold text-indigo-700">Start my submission</span>
                <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 transition-transform group-hover:translate-x-1">
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </button>

            <button
              onClick={() => navigate('/admin/login')}
              className="glass-panel glass-card-hover glass-sheen group rounded-[1.75rem] p-5 sm:p-7 text-left relative overflow-hidden active:scale-[0.995]"
            >
              <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full bg-gradient-to-br from-fuchsia-500/20 to-pink-400/10 blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
              <div className="flex items-start justify-between gap-4">
                <div className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-900 to-violet-800 text-white flex items-center justify-center shadow-xl shadow-indigo-950/30 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-7 h-7 text-cyan-300" />
                </div>
                <span className="rounded-full border border-fuchsia-500/20 bg-fuchsia-500/10 px-3 py-1 text-[8px] sm:text-[9px] font-extrabold uppercase tracking-[0.13em] text-fuchsia-700">
                  Authorized staff
                </span>
              </div>
              <h2 className="mt-4 sm:mt-5 font-display text-xl sm:text-2xl font-extrabold text-ink">
                Admin scrutiny panel
              </h2>
              <p className="mt-1.5 text-[12px] sm:text-[13px] leading-relaxed text-slate-600">
                A focused verification desk for the admission office. Review documents,
                leave remarks, export reports and download complete candidate archives.
              </p>
              <div className="mt-4 sm:mt-5 flex items-center justify-between border-t border-white/60 pt-4">
                <span className="text-[11px] sm:text-xs font-extrabold text-slate-900">Open scrutiny desk</span>
                <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-900 to-violet-800 text-white flex items-center justify-center shadow-lg shadow-slate-900/30 transition-transform group-hover:translate-x-1">
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </button>
            </div>
          </div>

          {/* feature strip */}
          <div className="order-3 lg:order-none grid sm:grid-cols-3 gap-3 sm:gap-4 mt-5 sm:mt-6 max-w-5xl mx-auto">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="glass-card rounded-2xl p-4 sm:p-5 flex items-start gap-3.5"
              >
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.iconTint} text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/20`}
                >
                  <feature.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[13px] font-extrabold text-slate-900 leading-tight">
                    {feature.title}
                  </p>
                  <p className="text-[11px] leading-relaxed text-slate-500 mt-1">{feature.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="relative z-10 px-4 sm:px-6 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
        <div className="max-w-7xl mx-auto glass-header rounded-2xl px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500 font-medium">
          <span>© 2027 Admissions Made Easy, Latur. All rights reserved.</span>
          <span className="flex items-center gap-1.5 font-bold text-slate-600">
            <Phone className="w-3 h-3 text-indigo-500" />
            Helpline: 94226 11661 · Latur, Maharashtra
          </span>
        </div>
      </footer>
    </div>
  );
}
