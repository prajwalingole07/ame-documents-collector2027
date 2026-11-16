import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * App-wide modal.
 *
 * Rendered through a portal on document.body so it can never be clipped by
 * transformed / backdrop-filter ancestors (the glass cards and animate-rise
 * wrappers). On phones it behaves like a native bottom sheet; on larger
 * screens it stays a centred dialog.
 */
export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKey = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const content = (
    <div className="fixed inset-0 z-[100]" role="presentation">
      <div
        className="absolute inset-0 bg-[#0b1024]/45 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="absolute inset-0 overflow-y-auto">
        <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={`relative w-full ${maxWidth} glass-modal rounded-t-[26px] sm:rounded-[26px] overflow-hidden animate-rise flex flex-col max-h-[94dvh] sm:max-h-[90dvh]`}
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400" />

            {/* mobile drag-handle cue */}
            <div className="sm:hidden pt-2.5 flex justify-center">
              <span className="w-10 h-1 rounded-full bg-slate-400/40" />
            </div>

            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-white/70 bg-white/45 backdrop-blur-md flex-shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-1.5 h-6 rounded-full bg-gradient-to-b from-indigo-500 to-cyan-400 flex-shrink-0" />
                <h3 className="font-display text-[15px] sm:text-lg font-extrabold text-ink truncate">
                  {title}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl border border-white/80 bg-white/65 text-slate-500 hover:text-indigo-700 hover:bg-white/95 transition-colors flex items-center justify-center flex-shrink-0 active:scale-95"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-6 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-6 overflow-y-auto flex-1 min-h-0 overscroll-contain">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
