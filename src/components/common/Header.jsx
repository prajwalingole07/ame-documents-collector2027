import React from 'react';
import { LogOut, ArrowLeft } from 'lucide-react';

export default function Header({ showLogout, onLogout, userInfo, showBack, onBack }) {
  return (
    <header className="glass-header sticky top-0 z-30 shadow-sm border-b border-white/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white text-slate-800 hover:text-blue-700 text-xs font-bold border border-slate-200 shadow-sm transition-all hover:scale-105 active:scale-95"
              title="Go back to previous tab"
            >
              <ArrowLeft className="w-4 h-4 text-blue-600" />
              <span>Back</span>
            </button>
          )}

          <div className="relative">
            <img
              src="/logo.jpg"
              alt="AME Logo"
              className="w-11 h-11 rounded-full object-cover ring-2 ring-amber-400 shadow-sm"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
          </div>
          <div>
            <h1 className="font-extrabold text-slate-900 tracking-tight text-sm sm:text-base leading-tight">
              ADMISSIONS MADE EASY, LATUR
            </h1>
            <p className="text-[11px] text-blue-700 font-semibold tracking-wide">
              Student Document Portal – 2027
            </p>
          </div>
        </div>

        {showLogout && (
          <div className="flex items-center gap-3">
            {userInfo && (
              <div className="text-right hidden sm:block">
                <p className="font-bold text-slate-900 text-xs truncate max-w-[200px]">
                  {userInfo.name}
                </p>
                <p className="text-[10px] text-slate-500 font-medium">
                  {userInfo.role === 'admin' ? 'Administrator' : `Reg: ${userInfo.regNo}`}
                </p>
              </div>
            )}
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20 transition-all hover:scale-105 active:scale-95"
              title="Sign out of your account"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
