import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

export default function ConfirmDialog({
  isOpen,
  title = 'Confirm Action',
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger = false,
  loading = false,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} maxWidth="max-w-md">
      <div className="flex items-start gap-4 mb-6">
        <div
          className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center border shadow-sm ${
            danger
              ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
              : 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20'
          }`}
        >
          <AlertTriangle className="w-6 h-6" />
        </div>
        <p className="text-[13px] leading-relaxed text-slate-600 font-medium pt-1">{message}</p>
      </div>
      <div className="flex items-center justify-end gap-2.5 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="btn-soft !px-4 !py-2.5"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[12px] font-extrabold text-white transition-all disabled:opacity-50 shadow-lg ${
            danger
              ? 'bg-gradient-to-r from-rose-600 to-red-500 shadow-rose-500/25 hover:brightness-110'
              : 'bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 shadow-indigo-500/25 hover:brightness-110'
          }`}
        >
          {loading && (
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          )}
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}
