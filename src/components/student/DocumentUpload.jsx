import React, { useState } from 'react';
import {
  getRequiredDocuments,
  COMMON_DOCUMENTS,
} from '../../utils/documentRequirements';
import DocumentCard from './DocumentCard';
import { Info, CheckCircle2, Clock, AlertTriangle, Send } from 'lucide-react';
import { updateStudent } from '../../firebase/studentService';
import toast from 'react-hot-toast';
import ConfirmDialog from '../common/ConfirmDialog';

export default function DocumentUpload({ studentData, documents = {} }) {
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const currentStudent = studentData || {
    name: 'Student',
    regNo: '',
    category: 'OPEN',
    applicationStatus: 'NOT_STARTED',
  };

  const allRequiredDocs = getRequiredDocuments(currentStudent.category || 'OPEN', false);
  const commonDocs = allRequiredDocs.filter((d) => COMMON_DOCUMENTS.some((c) => c.key === d.key));
  const categoryDocs = allRequiredDocs.filter(
    (d) => !COMMON_DOCUMENTS.some((c) => c.key === d.key)
  );

  const mandatoryDocs = allRequiredDocs.filter((d) => d.mandatory);
  const uploadedMandatory = mandatoryDocs.filter((d) => {
    const docEntry = documents[d.key];
    return docEntry && docEntry.status && docEntry.status !== 'NOT_UPLOADED' && docEntry.status !== 'REJECTED';
  });
  const approvedMandatory = mandatoryDocs.filter((d) => {
    const docEntry = documents[d.key];
    return docEntry && docEntry.status === 'APPROVED';
  });

  const reuploadCount = Object.values(documents).filter(
    (d) => d && (d.status === 'REJECTED' || d.status === 'RE_UPLOAD_REQUIRED')
  ).length;

  const isEligibleToSubmit = uploadedMandatory.length === mandatoryDocs.length;
  const isAlreadySubmitted =
    currentStudent.applicationStatus === 'SUBMITTED' ||
    currentStudent.applicationStatus === 'UNDER_VERIFICATION' ||
    currentStudent.applicationStatus === 'COMPLETED';

  const progressPercent = Math.round(
    (uploadedMandatory.length / Math.max(mandatoryDocs.length, 1)) * 100
  );

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    try {
      if (currentStudent.regNo) {
        await updateStudent(currentStudent.regNo, {
          applicationStatus: 'SUBMITTED',
          submittedAt: new Date().toISOString(),
        });
      }
      toast.success('All documents finalized and submitted for scrutiny!');
      setShowConfirm(false);
    } catch (err) {
      toast.error('Submission failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Submission Status */}
      <div className="glass-panel glass-sheen rounded-[1.6rem] p-5 sm:p-6 border border-white/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-display text-lg sm:text-xl font-extrabold text-ink tracking-tight">Document upload &amp; scrutiny checklist</h2>
            <span className="text-[9px] bg-indigo-500/10 text-indigo-700 font-extrabold px-2.5 py-1 rounded-full border border-indigo-500/20 uppercase tracking-wide">
              Category: {currentStudent.category}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Mandatory documents: <strong className="text-slate-800">{uploadedMandatory.length} of {mandatoryDocs.length}</strong> uploaded ({progressPercent}%)
          </p>
          <div className="w-full bg-white/45 border border-white/70 h-2.5 rounded-full mt-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400 h-full rounded-full transition-all duration-300 shadow-[0_0_14px_rgba(99,102,241,0.5)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <button
          onClick={() => setShowConfirm(true)}
          disabled={!isEligibleToSubmit || isAlreadySubmitted || submitting}
          className={`px-5 py-3 rounded-2xl text-[11px] font-extrabold shadow-md transition-all flex items-center gap-2 flex-shrink-0 ${
            isAlreadySubmitted
              ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 cursor-default'
              : isEligibleToSubmit
              ? 'bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 hover:brightness-110 text-white cursor-pointer hover:scale-[1.02] shadow-indigo-500/30'
              : 'bg-white/40 text-slate-400 cursor-not-allowed border border-white/70'
          }`}
        >
          {isAlreadySubmitted ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              Application Submitted
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Final Submit Application
            </>
          )}
        </button>
      </div>

      {/* Immediate Re-upload Notice if any doc is marked Incorrect */}
      {reuploadCount > 0 && (
        <div className="bg-amber-50/80 backdrop-blur border border-amber-400/40 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-[11px] text-amber-900">
            <p className="font-extrabold text-[13px]">Action required: document(s) marked incorrect</p>
            <p className="mt-0.5 leading-relaxed">
              The scrutiny officer has found discrepancies in {reuploadCount} document(s). Please check the highlighted card below, read the officer's reason, and click <strong>"Re-upload"</strong> to attach a clear, valid certificate.
            </p>
          </div>
        </div>
      )}

      {/* Section 1: Common Required Documents */}
      <div>
        <div className="glass-card rounded-xl px-4 py-3 mb-3 flex items-center justify-between">
          <h3 className="font-display font-extrabold text-ink text-[13px] flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center text-[11px] shadow-md shadow-indigo-500/20">01</span>
            General required documents
          </h3>
          <span className="text-[9px] font-bold uppercase tracking-wide text-slate-500">Applicable to all students</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {commonDocs.map((d) => (
            <DocumentCard
              key={d.key}
              doc={d}
              uploadedDoc={documents[d.key]}
              studentRegNo={currentStudent.regNo}
            />
          ))}
        </div>
      </div>

      {/* Section 2: Category Documents (SC, ST, OBC, VJ, NT, EWS, etc.) */}
      {categoryDocs.length > 0 && (
        <div className="pt-2">
          <div className="glass-card rounded-xl px-4 py-3 mb-3 flex items-center justify-between">
            <h3 className="font-display font-extrabold text-ink text-[13px] flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-sky-500 text-white flex items-center justify-center text-[11px] shadow-md shadow-cyan-500/20">02</span>
              Category documents — {currentStudent.category} quota
            </h3>
            <span className="text-[9px] font-bold uppercase tracking-wide text-cyan-700">Compulsory for reservation</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {categoryDocs.map((d) => (
              <DocumentCard
                key={d.key}
                doc={d}
                uploadedDoc={documents[d.key]}
                studentRegNo={currentStudent.regNo}
              />
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showConfirm}
        title="Finalize Application Submission"
        message="Are you sure you want to finalize your document submission? Your files will be submitted directly to the scrutiny verification team at Admissions Made Easy, Latur."
        confirmText="Yes, Submit Application"
        onConfirm={handleFinalSubmit}
        onCancel={() => setShowConfirm(false)}
        loading={submitting}
      />
    </div>
  );
}
