import React from 'react';
import { AlertTriangle, RefreshCw, XCircle, FileWarning } from 'lucide-react';
import { formatDate } from '../../utils/helpers';

export default function RejectedDocuments({ documents = {}, onNavigateToUpload }) {
  const rejectedDocs = Object.entries(documents || {}).filter(
    ([_, doc]) => doc && (doc.status === 'REJECTED' || doc.status === 'RE_UPLOAD_REQUIRED')
  );

  return (
    <div className="space-y-6">
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-100 rounded-xl text-red-600 flex-shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-red-900">Document Rejections & Action Required</h2>
            <p className="text-sm text-red-700 mt-1">
              Please review the remarks from the admission scrutiny team and re-upload the correct document as specified.
            </p>
          </div>
        </div>
      </div>

      {rejectedDocs.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
            ✓
          </div>
          <h3 className="text-base font-semibold text-gray-800">No Rejected Documents</h3>
          <p className="text-sm text-gray-400 mt-1">
            None of your documents have been rejected. You are in good standing!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {rejectedDocs.map(([key, doc]) => (
            <div
              key={key}
              className="bg-white rounded-xl border-2 border-red-200 p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <XCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-gray-900 capitalize">{key.replace(/_/g, ' ')}</h4>
                  <div className="mt-1 text-sm bg-red-50 text-red-800 rounded-lg p-2.5 border border-red-100">
                    <span className="font-semibold">Reason:</span> {doc.rejectionReason || 'Document did not meet verification criteria.'}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Actioned on: {formatDate(doc.rejectedAt || doc.uploadDate)} {doc.rejectedBy ? `by ${doc.rejectedBy}` : ''}
                  </p>
                </div>
              </div>

              <button
                onClick={onNavigateToUpload}
                className="w-full sm:w-auto px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors flex-shrink-0 shadow-sm"
              >
                <RefreshCw className="w-4 h-4" /> Go to Re-upload
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
