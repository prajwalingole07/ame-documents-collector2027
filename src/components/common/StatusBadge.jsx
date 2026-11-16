// StatusBadge — frosted, colour-coded pill for every document/application status.

const configs = {
  NOT_UPLOADED: {
    label: 'Not uploaded',
    className: 'bg-white/45 text-slate-600 border-white/70',
    dot: 'bg-slate-400',
  },
  UPLOADED: {
    label: 'Uploaded',
    className: 'bg-sky-500/10 text-sky-700 border-sky-500/20',
    dot: 'bg-sky-500',
  },
  UNDER_VERIFICATION: {
    label: 'Under verification',
    className: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
    dot: 'bg-amber-500',
  },
  APPROVED: {
    label: 'Approved',
    className: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
    dot: 'bg-emerald-500',
  },
  REJECTED: {
    label: 'Rejected',
    className: 'bg-rose-500/10 text-rose-700 border-rose-500/20',
    dot: 'bg-rose-500',
  },
  RE_UPLOAD_REQUIRED: {
    label: 'Re-upload required',
    className: 'bg-orange-500/10 text-orange-700 border-orange-500/20',
    dot: 'bg-orange-500',
  },
  NOT_STARTED: {
    label: 'Not started',
    className: 'bg-white/45 text-slate-600 border-white/70',
    dot: 'bg-slate-400',
  },
  IN_PROGRESS: {
    label: 'In progress',
    className: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20',
    dot: 'bg-indigo-500',
  },
  SUBMITTED: {
    label: 'Submitted',
    className: 'bg-violet-500/10 text-violet-700 border-violet-500/20',
    dot: 'bg-violet-500',
  },
  CORRECTION_REQUIRED: {
    label: 'Correction required',
    className: 'bg-orange-500/10 text-orange-700 border-orange-500/20',
    dot: 'bg-orange-500',
  },
  COMPLETED: {
    label: 'Completed',
    className: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
    dot: 'bg-emerald-500',
  },
};

export default function StatusBadge({ status }) {
  const cfg = configs[status] || configs.NOT_UPLOADED;
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-extrabold tracking-wide backdrop-blur-md ${cfg.className}`}
    >
      <span className={`status-dot ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
