import React, { useState } from 'react';
import {
  Eye,
  Download,
  FileText,
  Image as ImageIcon,
  Filter,
  Loader2,
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import Modal from '../common/Modal';
import { formatDate, formatFileSize, downloadDocumentFile } from '../../utils/helpers';
import { getDocumentFileUrl } from '../../firebase/fileStore';
import toast from 'react-hot-toast';

export default function SubmittedDocuments({ documents = {}, studentData }) {
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [preview, setPreview] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [downloadingKey, setDownloadingKey] = useState('');

  const docEntries = Object.entries(documents || {}).filter(
    ([_, doc]) => doc && doc.status && doc.status !== 'NOT_UPLOADED'
  );

  const filteredDocs = docEntries.filter(([_, doc]) => {
    if (filterStatus === 'ALL') return true;
    return doc.status === filterStatus;
  });

  const hasFile = (doc) => Boolean(doc?.fileId || doc?.url || doc?.downloadURL);

  const handlePreview = async (doc, key) => {
    setPreview({ ...doc, docKey: key });
    setPreviewUrl('');
    setLoadingPreview(true);
    try {
      const url = await getDocumentFileUrl(doc);
      if (!url) throw new Error('This file is not available in the cloud.');
      setPreviewUrl(url);
    } catch (err) {
      toast.error('Preview failed: ' + err.message);
      setPreview(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleDownload = async (doc, key) => {
    setDownloadingKey(key);
    try {
      await downloadDocumentFile(doc, key, doc.fileName);
      toast.success('Download started');
    } catch (err) {
      toast.error('Download failed: ' + err.message);
    } finally {
      setDownloadingKey('');
    }
  };

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
            <option value="UPLOADED">Uploaded</option>
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

                {hasFile(doc) && (
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => handlePreview(doc, key)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> View / Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownload(doc, key)}
                      disabled={downloadingKey === key}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-60"
                    >
                      {downloadingKey === key ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={Boolean(preview)}
        onClose={() => setPreview(null)}
        title={`Document Preview: ${preview?.docKey?.replace(/_/g, ' ') || 'Document'}`}
        maxWidth="max-w-4xl"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 border-b pb-2 gap-3 flex-wrap">
            <span>
              <strong>Student:</strong> {studentData?.name || '-'} ({studentData?.regNo || '-'}) •{' '}
              <strong>File:</strong> {preview?.fileName || 'document'}
            </span>
            <button
              type="button"
              onClick={() => handleDownload(preview, preview?.docKey)}
              className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
            >
              <Download className="w-3.5 h-3.5" /> Download
            </button>
          </div>

          <div className="w-full bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center min-h-[180px] sm:min-h-[420px] max-h-[52vh] sm:max-h-[72vh]">
            {loadingPreview ? (
              <div className="text-center text-slate-300 text-xs flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Loading document from the cloud...</span>
              </div>
            ) : !previewUrl ? (
              <div className="text-center text-slate-300 text-xs">
                No preview available. Please download the file instead.
              </div>
            ) : preview?.fileType?.startsWith('image/') ||
              preview?.fileName?.match(/\.(jpg|jpeg|png|webp)$/i) ? (
              <img
                src={previewUrl}
                alt={preview?.docKey}
                className="max-w-full max-h-[48vh] sm:max-h-[70vh] object-contain mx-auto"
              />
            ) : (
              <iframe
                src={previewUrl}
                title={preview?.docKey}
                className="w-full h-[48vh] sm:h-[68vh] border-0 rounded-xl bg-white"
              />
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
