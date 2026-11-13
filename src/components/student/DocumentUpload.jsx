import React, { useState } from 'react';
import {
  getRequiredDocuments,
  COMMON_DOCUMENTS,
} from '../../utils/documentRequirements';
import DocumentCard from './DocumentCard';
import { Info, CheckCircle2, Clock, AlertTriangle, Send } from 'lucide-react';
import { db } from '../../firebase/config';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
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
        await updateDoc(doc(db, 'students', currentStudent.regNo), {
          applicationStatus: 'SUBMITTED',
          submittedAt: serverTimestamp(),
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
      <div className="glass-panel rounded-3xl p-6 border border-white/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Document Upload &amp; Scrutiny Checklist</h2>
            <span className="text-xs bg-amber-100 text-amber-900 font-bold px-2.5 py-0.5 rounded-full border border-amber-300">
              Category: {currentStudent.category}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Mandatory Documents: <strong className="text-slate-800">{uploadedMandatory.length} of {mandatoryDocs.length}</strong> uploaded ({progressPercent}%)
          </p>
          <div className="w-full bg-slate-200/60 h-2.5 rounded-full mt-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <button
          onClick={() => setShowConfirm(true)}
          disabled={!isEligibleToSubmit || isAlreadySubmitted || submitting}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold shadow-md transition-all flex items-center gap-2 flex-shrink-0 ${
            isAlreadySubmitted
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default'
              : isEligibleToSubmit
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white cursor-pointer hover:scale-105'
              : 'bg-slate-200/80 text-slate-400 cursor-not-allowed border border-slate-300/60'
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
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex items-start gap-3 shadow-sm animate-pulse">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900">
            <p className="font-bold text-sm">Action Required: Document(s) marked Incorrect</p>
            <p className="mt-0.5">
              The scrutiny officer has found discrepancies in {reuploadCount} document(s). Please check the highlighted card below, read the officer's reason, and click <strong>"Re-upload"</strong> to attach a clear, valid certificate.
            </p>
          </div>
        </div>
      )}

      {/* Section 1: Common Required Documents */}
      <div>
        <div className="bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 mb-3 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm">📋 General Required Documents</h3>
          <span className="text-[11px] text-slate-500">Applicable to all students</span>
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
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 mb-3 flex items-center justify-between">
            <h3 className="font-bold text-blue-900 text-sm">
              🏷️ Category Documents — {currentStudent.category} Quota
            </h3>
            <span className="text-[11px] text-blue-600 font-semibold">Compulsory for reservation</span>
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
