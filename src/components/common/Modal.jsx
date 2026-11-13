import React from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-[#0b1024]/45 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={`relative w-full ${maxWidth} glass-modal rounded-[26px] overflow-hidden animate-rise`}
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400" />
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/70 bg-white/35">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-1.5 h-6 rounded-full bg-gradient-to-b from-indigo-500 to-cyan-400 flex-shrink-0" />
              <h3 className="font-display text-base sm:text-lg font-extrabold text-ink truncate">
                {title}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl border border-white/80 bg-white/55 text-slate-400 hover:text-indigo-700 hover:bg-white/90 transition-colors flex items-center justify-center flex-shrink-0"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-5 sm:p-6 max-h-[80vh] overflow-y-auto">{children}</div>
        </div>
      </div>
    </div>
  );
}
