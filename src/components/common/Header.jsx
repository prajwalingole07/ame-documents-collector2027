import React from 'react';
import { ArrowLeft, LogOut, ShieldCheck } from 'lucide-react';

export default function Header({ showLogout, onLogout, userInfo, showBack, onBack }) {
  const initial = (userInfo?.name || 'A').trim().charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 glass-header">
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {showBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/80 bg-white/55 px-2 sm:px-2.5 py-2 text-xs font-bold text-slate-600 hover:text-indigo-700 hover:bg-white/85 shadow-sm transition-all hover:-translate-x-0.5 active:translate-x-0"
              title="Go back to previous tab"
            >
              <ArrowLeft className="w-4 h-4 text-indigo-600" />
              <span className="hidden md:inline">Back</span>
            </button>
          )}

          <div className="ring-gradient flex-shrink-0">
            <img
              src="/logo.jpg"
              alt="AME Logo"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover bg-white"
            />
          </div>
          <div className="min-w-0">
            <h1 className="font-display font-extrabold text-ink tracking-tight text-[11px] sm:text-[15px] leading-tight truncate">
              <span className="sm:hidden">ADMISSIONS MADE EASY</span>
              <span className="hidden sm:inline">ADMISSIONS MADE EASY, LATUR</span>
            </h1>
            <p className="text-[8px] sm:text-[10px] text-indigo-700 font-extrabold tracking-[0.1em] sm:tracking-[0.14em] uppercase truncate whitespace-nowrap">
              <span className="sm:hidden">
                {userInfo?.role === 'admin' ? 'ADMIN CONTROL · 2027' : 'STUDENT PORTAL · 2027'}
              </span>
              <span className="hidden sm:inline">
                {userInfo?.role === 'admin'
                  ? 'Admin Scrutiny Portal · 2027'
                  : 'Student Document Portal · 2027'}
              </span>
            </p>
          </div>

          <span className="hidden xl:inline-flex items-center gap-1.5 ml-2 rounded-full border border-white/80 bg-white/45 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
            <ShieldCheck className="w-3 h-3 text-indigo-500" />
            Secure cloud
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {userInfo && (
            <div className="flex items-center gap-2.5 rounded-2xl border border-white/75 bg-white/45 py-1 pl-1 pr-1 sm:py-1.5 sm:pl-1.5 sm:pr-3 shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-500 text-white flex items-center justify-center font-display text-xs font-extrabold shadow-md shadow-indigo-500/25 flex-shrink-0">
                {initial}
              </div>
              <div className="hidden sm:block min-w-0">
                <p className="font-extrabold text-slate-900 text-[11px] truncate max-w-[180px] leading-tight">
                  {userInfo.name}
                </p>
                <p className="text-[9px] text-slate-500 font-bold truncate">
                  {userInfo.role === 'admin' ? 'Administrator' : `Reg: ${userInfo.regNo}`}
                </p>
              </div>
            </div>
          )}

          {showLogout && (
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/15 bg-rose-500/10 px-2.5 sm:px-3 py-2 text-[11px] font-extrabold text-rose-600 hover:bg-rose-500 hover:text-white transition-all shadow-sm hover:shadow-lg hover:shadow-rose-500/25"
              title="Sign out of your account"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
