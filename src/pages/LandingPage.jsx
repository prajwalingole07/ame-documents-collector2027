import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Shield, LogIn, Phone, FileCheck, ArrowRight, Sparkles } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col justify-between selection:bg-blue-500 selection:text-white">
      {/* Sunlight glow in the top-left corner */}
      <div className="sunlight-glow" />
      <div className="fixed top-1/4 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-blue-200/40 via-indigo-100/30 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Top Glass Header */}
      <header className="glass-header relative z-10 py-4 px-6 sm:px-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src="/logo.jpg"
                alt="AME Logo"
                className="w-12 h-12 rounded-full object-cover ring-2 ring-amber-400 shadow-md"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
            </div>
            <div>
              <h1 className="font-black text-slate-900 tracking-tight text-base sm:text-lg">
                ADMISSIONS MADE EASY, LATUR
              </h1>
              <p className="text-xs text-blue-700 font-bold tracking-wide">
                Student Document Portal – 2027
              </p>
            </div>
          </div>

          <a
            href="tel:9422611661"
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/80 hover:bg-white text-slate-800 text-xs font-bold border border-slate-200 shadow-sm transition-all hover:scale-105"
          >
            <Phone className="w-3.5 h-3.5 text-blue-600" />
            <span>Helpline: 94226 11661</span>
          </a>
        </div>
      </header>

      {/* Hero Body */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-12">
        <div className="w-full max-w-5xl mx-auto">
          {/* Hero Banner Pill */}
          <div className="text-center mb-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/20 border border-amber-300 text-amber-900 text-xs font-black uppercase tracking-wider shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Official Admission Session 2027</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight max-w-3xl mx-auto leading-tight">
              Fast, Paperless &amp; Transparent <span className="bg-gradient-to-r from-blue-700 via-indigo-600 to-amber-600 bg-clip-text text-transparent">Document Scrutiny</span>
            </h2>

            <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto font-medium">
              Upload required admission certificates, view real-time verification status, and receive immediate remarks directly from the scrutiny committee.
            </p>
          </div>

          {/* Glass Portal Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Student Portal Card */}
            <div
              onClick={() => navigate('/student/login')}
              className="glass-panel glass-card-hover rounded-3xl p-8 sm:p-10 cursor-pointer flex flex-col justify-between group relative overflow-hidden border border-white/80"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 rounded-bl-full pointer-events-none group-hover:bg-blue-500/20 transition-all" />

              <div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mb-6 shadow-lg shadow-blue-600/30 group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-9 h-9" />
                </div>

                <div className="inline-block px-3 py-1 rounded-lg bg-blue-100 text-blue-800 text-[11px] font-bold uppercase tracking-wider mb-2">
                  Candidates &amp; Parents
                </div>

                <h3 className="text-2xl font-black text-slate-900 tracking-tight group-hover:text-blue-700 transition-colors">
                  Student Portal
                </h3>

                <p className="text-slate-500 text-xs sm:text-sm mt-2 leading-relaxed">
                  Log in using your <strong>Registration / Receipt Number</strong> and Mobile number to submit SSC, HSC, Caste, NCL and other admission certificates.
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-200/60 flex items-center justify-between text-blue-700 font-bold text-sm">
                <span>Enter Student Portal</span>
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center group-hover:translate-x-1 transition-transform shadow-md">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Admin Scrutiny Card */}
            <div
              onClick={() => navigate('/admin/login')}
              className="glass-panel glass-card-hover rounded-3xl p-8 sm:p-10 cursor-pointer flex flex-col justify-between group relative overflow-hidden border border-white/80"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-bl-full pointer-events-none group-hover:bg-amber-500/20 transition-all" />

              <div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-slate-900 to-indigo-950 text-white flex items-center justify-center mb-6 shadow-lg shadow-slate-900/30 group-hover:scale-110 transition-transform">
                  <Shield className="w-8 h-8 text-amber-400" />
                </div>

                <div className="inline-block px-3 py-1 rounded-lg bg-slate-200 text-slate-800 text-[11px] font-bold uppercase tracking-wider mb-2">
                  Authorized Staff
                </div>

                <h3 className="text-2xl font-black text-slate-900 tracking-tight group-hover:text-indigo-800 transition-colors">
                  Admin Scrutiny Portal
                </h3>

                <p className="text-slate-500 text-xs sm:text-sm mt-2 leading-relaxed">
                  Strictly for admission office verification officers. Scrutinize uploaded documents, export Excel sheets, and download 1-click candidate ZIP archives.
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-200/60 flex items-center justify-between text-slate-900 font-bold text-sm">
                <span>Enter Scrutiny Panel</span>
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center group-hover:translate-x-1 transition-transform shadow-md">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="glass-header relative z-10 py-4 px-6 border-t border-white/60 text-center text-xs text-slate-500 font-medium">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2027 Admissions Made Easy, Latur. All Rights Reserved.</span>
          <span className="text-slate-600 font-bold">Helpline: 📞 94226 11661 • Latur, Maharashtra</span>
        </div>
      </footer>
    </div>
  );
}
