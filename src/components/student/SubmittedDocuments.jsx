import React, { useState } from 'react';
import { Eye, Download, FileText, Image as ImageIcon, CheckCircle, Clock, XCircle, AlertCircle, Filter } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import { formatDate, formatFileSize } from '../../utils/helpers';

export default function SubmittedDocuments({ documents = {}, studentData }) {
  const [filterStatus, setFilterStatus] = useState('ALL');

  const docEntries = Object.entries(documents || {}).filter(
    ([_, doc]) => doc && doc.status && doc.status !== 'NOT_UPLOADED'
  );

  const filteredDocs = docEntries.filter(([_, doc]) => {
    if (filterStatus === 'ALL') return true;
    return doc.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">My Submitted Documents</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Total {docEntries.length} documents uploaded
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Statuses ({docEntries.length})</option>
            <option value="APPROVED">Approved</option>
            <option value="UNDER_VERIFICATION">Under Verification</option>
            <option value="REJECTED">Rejected</option>
            <option value="RE_UPLOAD_REQUIRED">Re-upload Required</option>
          </select>
        </div>
      </div>

      {filteredDocs.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-700">No documents found</h3>
          <p className="text-sm text-gray-400 mt-1">
            {filterStatus === 'ALL'
              ? 'You have not uploaded any documents yet.'
              : `No documents with status "${filterStatus}".`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDocs.map(([key, doc]) => {
            const isImage = doc.fileType?.startsWith('image/');
            return (
              <div
                key={key}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700 uppercase tracking-wide">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <StatusBadge status={doc.status} />
                  </div>

                  <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 mb-3">
                    {isImage ? (
                      <ImageIcon className="w-8 h-8 text-blue-500 flex-shrink-0" />
                    ) : (
                      <FileText className="w-8 h-8 text-red-500 flex-shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {doc.fileName || `${key}.pdf`}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatFileSize(doc.fileSize)} • Uploaded {formatDate(doc.uploadDate)}
                      </p>
                    </div>
                  </div>

                  {doc.remarks && (
                    <div className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-md p-2 mb-3">
                      <span className="font-semibold">Admin Remarks:</span> {doc.remarks}
                    </div>
                  )}

                  {doc.rejectionReason && (
                    <div className="text-xs bg-red-50 text-red-700 border border-red-200 rounded-md p-2 mb-3">
                      <span className="font-semibold">Rejection Reason:</span> {doc.rejectionReason}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  {doc.url && (
                    <>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> View / Preview
                      </a>
                      <a
                        href={doc.url}
                        download={doc.fileName || `${key}.pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
