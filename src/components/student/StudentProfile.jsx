import React, { useEffect, useState } from 'react';
import { User, Phone, Calendar, Tag, CheckCircle, Clock, Cloud } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import { formatDate, formatDateTime, getApplicationStatus } from '../../utils/helpers';
import { getRequiredDocuments } from '../../utils/documentRequirements';
import { getDocumentFileUrl } from '../../firebase/fileStore';

export default function StudentProfile({ studentData, documents }) {
  const [photoUrl, setPhotoUrl] = useState('');

  // The photo is stored as a chunked cloud file, so resolve a browser URL
  // whenever the live document metadata changes.
  useEffect(() => {
    let cancelled = false;
    const photo = documents?.photograph;
    if (!photo || (!photo.fileId && !photo.url && !photo.downloadURL)) {
      setPhotoUrl('');
      return () => {};
    }
    getDocumentFileUrl(photo)
      .then((url) => {
        if (!cancelled) setPhotoUrl(url || '');
      })
      .catch(() => {
        if (!cancelled) setPhotoUrl('');
      });
    return () => {
      cancelled = true;
    };
  }, [documents?.photograph?.fileId, documents?.photograph?.url, documents?.photograph?.downloadURL]);

  const currentStudent = studentData || {
    name: 'Student',
    regNo: '-',
    category: 'OPEN',
    contact1: '',
    contact2: '',
    dob: '',
    applicationStatus: 'NOT_STARTED',
    applyFeeConcession: false,
  };

  const requiredDocs = getRequiredDocuments(currentStudent.category, currentStudent.applyFeeConcession);
  const mandatoryDocs = requiredDocs.filter((d) => d.mandatory);
  const uploadedCount = Object.values(documents || {}).filter(
    (d) => d?.status && d.status !== 'NOT_UPLOADED'
  ).length;
  const approvedCount = Object.values(documents || {}).filter(
    (d) => d?.status === 'APPROVED'
  ).length;
  const appStatus = currentStudent.applicationStatus || getApplicationStatus(documents, requiredDocs);

  const progressPct = mandatoryDocs.length
    ? Math.min(100, Math.round((uploadedCount / mandatoryDocs.length) * 100))
    : 0;

  return (
    <div className="space-y-5">
      {/* Profile hero */}
      <div className="relative overflow-hidden rounded-[1.7rem] bg-gradient-to-br from-indigo-700 via-violet-700 to-cyan-600 p-6 sm:p-7 text-white shadow-[0_35px_80px_-32px_rgba(49,46,129,0.75)]">
        <div className="absolute -right-20 -top-24 w-72 h-72 rounded-full bg-white/15 blur-2xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-28 w-64 h-64 rounded-full bg-cyan-300/20 blur-2xl pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />

        <div className="relative flex flex-col md:flex-row items-center md:items-start gap-5">
          <div className="p-1.5 rounded-full bg-white/20 border border-white/30 backdrop-blur shadow-xl flex-shrink-0">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt="Student"
                className="w-24 h-24 rounded-full object-cover bg-white"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                <User className="w-11 h-11 text-white/80" />
              </div>
            )}
          </div>

          <div className="flex-1 text-center md:text-left min-w-0">
            <p className="inline-flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-[0.18em] text-cyan-100">
              <Cloud className="w-3 h-3" /> Verified student profile
            </p>
            <h2 className="mt-1 font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
              {currentStudent.name}
            </h2>
            <p className="text-[11px] sm:text-xs text-indigo-100/90 font-semibold mt-1">
              Registration / Receipt No: {currentStudent.regNo}
            </p>
            <div className="mt-3 flex flex-wrap justify-center md:justify-start items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 backdrop-blur px-3 py-1 text-[10px] font-extrabold text-white">
                <Tag className="w-3 h-3" /> {currentStudent.category} Quota
              </span>
              <StatusBadge status={appStatus} />
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 backdrop-blur px-3 py-1 text-[10px] font-bold text-cyan-50">
                <span className="status-dot bg-emerald-300 live-dot" /> Cloud synced
              </span>
            </div>
          </div>

          <div className="hidden lg:flex flex-col items-end gap-2">
            <span className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-indigo-100/80">
              Overall completion
            </span>
            <span className="font-display text-3xl font-black text-white">{progressPct}%</span>
            <div className="w-28 h-1.5 rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {[
          { icon: User, label: 'Full name', value: currentStudent.name },
          { icon: Tag, label: 'Registration / receipt number', value: currentStudent.regNo },
          { icon: Tag, label: 'Category', value: currentStudent.category },
          { icon: Calendar, label: 'Date of birth', value: currentStudent.dob || 'Not specified' },
          {
            icon: Phone,
            label: 'Student mobile (contact 1)',
            value: currentStudent.contact1 || 'Not specified',
          },
          {
            icon: Phone,
            label: 'Parent mobile (contact 2)',
            value: currentStudent.contact2 || 'Not specified',
          },
          {
            icon: Clock,
            label: 'Last login',
            value: currentStudent.lastLogin ? formatDateTime(currentStudent.lastLogin) : 'Active now',
          },
          {
            icon: CheckCircle,
            label: 'Application status',
            value: <StatusBadge status={appStatus} />,
          },
        ].map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="glass-card rounded-2xl p-4 flex items-center gap-3.5 hover:-translate-y-0.5 transition-transform"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/15 to-cyan-400/10 border border-white/70 text-indigo-600 flex items-center justify-center flex-shrink-0">
              <Icon className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-slate-500">
                {label}
              </p>
              <div className="font-bold text-slate-800 text-[13px] truncate mt-0.5">{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Progress summary */}
      <div className="glass-card rounded-2xl p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="font-display text-sm font-extrabold text-ink flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/25">
              <CheckCircle className="w-4 h-4" />
            </span>
            Document verification overview
          </h3>
          <span className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
            Live status
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center mb-4">
          <div className="rounded-2xl border border-white/70 bg-indigo-500/10 px-3 py-4">
            <p className="font-display text-2xl font-extrabold text-indigo-700">{uploadedCount}</p>
            <p className="text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-wide">Uploaded</p>
          </div>
          <div className="rounded-2xl border border-white/70 bg-emerald-500/10 px-3 py-4">
            <p className="font-display text-2xl font-extrabold text-emerald-700">{approvedCount}</p>
            <p className="text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-wide">Approved</p>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/40 px-3 py-4">
            <p className="font-display text-2xl font-extrabold text-slate-700">{mandatoryDocs.length}</p>
            <p className="text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-wide">Mandatory</p>
          </div>
        </div>

        <div className="relative h-2.5 rounded-full bg-white/50 border border-white/70 overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-[10px] font-semibold text-slate-500 mt-2 text-center">
          {uploadedCount} of {mandatoryDocs.length} mandatory documents uploaded ({progressPct}%)
        </p>
      </div>
    </div>
  );
}
