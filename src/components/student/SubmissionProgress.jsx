import React, { useState } from 'react';
import { CheckCircle2, Clock, AlertCircle, Send, Check } from 'lucide-react';
import { getRequiredDocuments } from '../../utils/documentRequirements';
import { db } from '../../firebase/config';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import ConfirmDialog from '../common/ConfirmDialog';

export default function SubmissionProgress({ studentData, documents = {} }) {
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!studentData) return null;

  const requiredDocs = getRequiredDocuments(studentData.category, studentData.applyFeeConcession);
  const mandatoryDocs = requiredDocs.filter(d => d.mandatory);

  const uploadedMandatory = mandatoryDocs.filter(d => {
    const docEntry = documents[d.key];
    return docEntry && docEntry.status && docEntry.status !== 'NOT_UPLOADED' && docEntry.status !== 'REJECTED';
  });

  const approvedMandatory = mandatoryDocs.filter(d => {
    const docEntry = documents[d.key];
    return docEntry && docEntry.status === 'APPROVED';
  });

  const isEligibleToSubmit = uploadedMandatory.length === mandatoryDocs.length;
  const isAlreadySubmitted = studentData.applicationStatus === 'SUBMITTED' ||
                             studentData.applicationStatus === 'UNDER_VERIFICATION' ||
                             studentData.applicationStatus === 'COMPLETED';

  const progressPercent = Math.round((uploadedMandatory.length / Math.max(mandatoryDocs.length, 1)) * 100);

  const handleSubmitApplication = async () => {
    try {
      setSubmitting(true);
      await updateDoc(doc(db, 'students', studentData.regNo), {
        applicationStatus: 'SUBMITTED',
        submittedAt: serverTimestamp(),
      });
      toast.success('Application submitted successfully!');
      setShowConfirm(false);
    } catch (err) {
      toast.error('Failed to submit application: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Submission & Verification Progress</h2>
        <p className="text-sm text-gray-500 mb-6">
          Track the status of your admission document submission and scrutiny verification.
        </p>

        <div className="mb-6">
          <div className="flex justify-between items-center text-sm font-semibold text-gray-700 mb-2">
            <span>Mandatory Document Uploads</span>
            <span>{uploadedMandatory.length} of {mandatoryDocs.length} Completed ({progressPercent}%)</span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-blue-50/60 border border-blue-100 p-4 rounded-xl">
            <p className="text-xs font-semibold text-blue-600 uppercase">Uploaded</p>
            <p className="text-2xl font-bold text-blue-900 mt-1">{uploadedMandatory.length}</p>
            <p className="text-xs text-blue-500 mt-0.5">out of {mandatoryDocs.length} mandatory</p>
          </div>
          <div className="bg-green-50/60 border border-green-100 p-4 rounded-xl">
            <p className="text-xs font-semibold text-green-600 uppercase">Approved by Admin</p>
            <p className="text-2xl font-bold text-green-900 mt-1">{approvedMandatory.length}</p>
            <p className="text-xs text-green-500 mt-0.5">verified and locked</p>
          </div>
          <div className="bg-amber-50/60 border border-amber-100 p-4 rounded-xl">
            <p className="text-xs font-semibold text-amber-600 uppercase">Pending Approval</p>
            <p className="text-2xl font-bold text-amber-900 mt-1">
              {Math.max(0, uploadedMandatory.length - approvedMandatory.length)}
            </p>
            <p className="text-xs text-amber-500 mt-0.5">under scrutiny</p>
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-base font-bold text-gray-800 mb-4">Mandatory Checklist for Submission</h3>
        <div className="divide-y divide-gray-100">
          {mandatoryDocs.map((docItem) => {
            const uploaded = documents[docItem.key];
            const isDone = uploaded && uploaded.status && uploaded.status !== 'NOT_UPLOADED' && uploaded.status !== 'REJECTED';
            const isApproved = uploaded && uploaded.status === 'APPROVED';

            return (
              <div key={docItem.key} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      isApproved
                        ? 'bg-green-100 text-green-700'
                        : isDone
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {isApproved ? '✓' : isDone ? '•' : '○'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{docItem.label}</p>
                    <p className="text-xs text-gray-400">
                      {isApproved
                        ? 'Approved & Verified'
                        : isDone
                        ? 'Uploaded (Under verification)'
                        : 'Upload Required'}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    isApproved
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : isDone
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-red-50 text-red-600 border border-red-200'
                  }`}
                >
                  {isApproved ? 'Approved' : isDone ? 'Uploaded' : 'Missing'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Final Application Submit Card */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-bold">Final Application Submission</h3>
            <p className="text-sm text-blue-200 mt-1 max-w-xl">
              {isAlreadySubmitted
                ? 'Your application has been submitted to Admissions Made Easy, Latur and is being verified.'
                : isEligibleToSubmit
                ? 'All mandatory documents have been uploaded! Click below to finalize and lock your document submission for scrutiny.'
                : 'Upload all mandatory documents marked in the checklist above before submitting.'}
            </p>
            {studentData.submittedAt && (
              <p className="text-xs text-yellow-300 mt-2 font-medium">
                Submitted on: {new Date(studentData.submittedAt?.toDate?.() || studentData.submittedAt).toLocaleString('en-IN')}
              </p>
            )}
          </div>

          <button
            onClick={() => setShowConfirm(true)}
            disabled={!isEligibleToSubmit || isAlreadySubmitted || submitting}
            className={`px-6 py-3 rounded-xl font-bold text-sm shadow-md flex items-center gap-2 transition-all flex-shrink-0 ${
              isAlreadySubmitted
                ? 'bg-green-500/20 text-green-200 border border-green-400 cursor-not-allowed'
                : isEligibleToSubmit
                ? 'bg-yellow-400 hover:bg-yellow-300 text-blue-950 cursor-pointer hover:scale-105'
                : 'bg-white/10 text-white/40 cursor-not-allowed'
            }`}
          >
            {isAlreadySubmitted ? (
              <>
                <Check className="w-5 h-5 text-green-400" />
                Application Submitted
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Submit Application
              </>
            )}
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showConfirm}
        title="Confirm Application Submission"
        message="Are you sure you want to finalize your document submission? Your files will be submitted directly to the scrutiny verification team at Admissions Made Easy, Latur."
        confirmText="Yes, Submit Application"
        onConfirm={handleSubmitApplication}
        onCancel={() => setShowConfirm(false)}
        loading={submitting}
      />
    </div>
  );
}
