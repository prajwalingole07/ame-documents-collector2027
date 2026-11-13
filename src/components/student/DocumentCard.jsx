import React, { useState, useRef } from 'react';
import {
  Upload,
  Eye,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  FileText,
  Image as ImageIcon,
  ExternalLink,
} from 'lucide-react';
import { uploadDocument } from '../../firebase/documentService';
import { downloadSingleFile, getStandardDocFileName, formatDate, formatFileSize } from '../../utils/helpers';
import StatusBadge from '../common/StatusBadge';
import Modal from '../common/Modal';
import toast from 'react-hot-toast';

export default function DocumentCard({ doc, uploadedDoc, studentRegNo }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const fileInputRef = useRef(null);

  const status = uploadedDoc?.status || 'NOT_UPLOADED';
  const isLocked = status === 'APPROVED' && !doc.allowReplace;

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only PDF, JPG, JPEG, PNG files are allowed');
      e.target.value = '';
      return;
    }
    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      e.target.value = '';
      return;
    }

    setUploading(true);
    setProgress(0);
    try {
      await uploadDocument(studentRegNo, doc.key, file, (p) => setProgress(p));
      toast.success(`${doc.label} uploaded successfully!`);
    } catch (err) {
      toast.error('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
      setProgress(0);
      e.target.value = '';
    }
  };

  const isImage =
    uploadedDoc?.fileType?.startsWith('image/') ||
    uploadedDoc?.fileName?.match(/\.(jpg|jpeg|png)$/i);
  const isPdf =
    uploadedDoc?.fileType === 'application/pdf' ||
    uploadedDoc?.fileName?.match(/\.pdf$/i);

  const cardBorder =
    status === 'APPROVED'
      ? 'border-green-300 bg-green-50'
      : status === 'REJECTED'
      ? 'border-red-300 bg-red-50'
      : status === 'RE_UPLOAD_REQUIRED'
      ? 'border-orange-300 bg-orange-50'
      : status === 'UNDER_VERIFICATION'
      ? 'border-yellow-300 bg-yellow-50'
      : status === 'UPLOADED'
      ? 'border-blue-300 bg-blue-50'
      : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md';

  const uploadBtnClass =
    status === 'NOT_UPLOADED'
      ? 'bg-blue-600 text-white hover:bg-blue-700'
      : status === 'REJECTED' || status === 'RE_UPLOAD_REQUIRED'
      ? 'bg-orange-500 text-white hover:bg-orange-600'
      : 'bg-gray-200 text-gray-700 hover:bg-gray-300';

  const uploadBtnLabel =
    status === 'NOT_UPLOADED' ? 'Upload' : status === 'REJECTED' ? 'Re-upload' : 'Replace';

  return (
    <div className={`rounded-xl border-2 p-5 transition-all duration-200 ${cardBorder}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-gray-800 text-sm">{doc.label}</h4>
            {doc.mandatory ? (
              <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                ★ Mandatory
              </span>
            ) : (
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                Optional
              </span>
            )}
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Uploaded file info */}
      {uploadedDoc?.fileName && (
        <div className="bg-white bg-opacity-70 rounded-lg p-3 mb-3 flex items-center gap-3">
          {isImage ? (
            <ImageIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
          ) : (
            <FileText className="w-5 h-5 text-red-500 flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-700 truncate">{uploadedDoc.fileName}</p>
            <p className="text-xs text-gray-400">
              {formatFileSize(uploadedDoc.fileSize)} · Uploaded {formatDate(uploadedDoc.uploadDate)}
            </p>
          </div>
        </div>
      )}

      {/* Rejection reason */}
      {(status === 'REJECTED' || status === 'RE_UPLOAD_REQUIRED') && uploadedDoc?.rejectionReason && (
        <div className="bg-red-100 border border-red-200 rounded-lg p-3 mb-3 flex gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-red-700">Correction Required:</p>
            <p className="text-xs text-red-600 mt-0.5">{uploadedDoc.rejectionReason}</p>
          </div>
        </div>
      )}

      {/* Admin remarks */}
      {status === 'APPROVED' && uploadedDoc?.remarks && (
        <div className="bg-green-100 border border-green-200 rounded-lg p-3 mb-3">
          <p className="text-xs font-semibold text-green-700">
            Admin Remarks: <span className="font-normal">{uploadedDoc.remarks}</span>
          </p>
        </div>
      )}

      {/* Upload progress */}
      {uploading && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Processing...</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {/* Upload / Re-upload button */}
        {!isLocked && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${uploadBtnClass}`}
          >
            {status === 'NOT_UPLOADED' ? (
              <Upload className="w-3.5 h-3.5" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            {uploading ? 'Uploading...' : uploadBtnLabel}
          </button>
        )}

        {/* On-page Modal Preview button */}
        {(uploadedDoc?.url || uploadedDoc?.downloadURL) && (
          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" /> Preview
          </button>
        )}

        {/* Download button with Official Standardized Name */}
        {(uploadedDoc?.url || uploadedDoc?.downloadURL) && (
          <button
            type="button"
            onClick={() => downloadSingleFile(uploadedDoc.url || uploadedDoc.downloadURL, doc.key, uploadedDoc.fileName)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
            title={`Download as "${getStandardDocFileName(doc.key, uploadedDoc.fileName)}"`}
          >
            <Download className="w-3.5 h-3.5" /> Download
          </button>
        )}

        {/* Locked indicator */}
        {isLocked && (
          <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
            <CheckCircle className="w-3.5 h-3.5" /> Approved &amp; Locked
          </span>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleFileSelect}
        hidden
        multiple={doc.multiple || false}
      />

      {/* On-Page Embedded Document Preview Modal */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title={`Preview: ${doc.label}`}
        maxWidth="max-w-4xl"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 border-b pb-2">
            <span>
              <strong>File:</strong> {uploadedDoc?.fileName || 'Document'} ({formatFileSize(uploadedDoc?.fileSize)})
            </span>
            <button
              type="button"
              onClick={() => downloadSingleFile(uploadedDoc?.url || uploadedDoc?.downloadURL, doc.key, uploadedDoc?.fileName)}
              className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
            >
              <Download className="w-3.5 h-3.5" /> Download as "{getStandardDocFileName(doc.key, uploadedDoc?.fileName)}"
            </button>
          </div>

          <div className="w-full bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center min-h-[420px] max-h-[70vh]">
            {isImage ? (
              <img
                src={uploadedDoc?.url || uploadedDoc?.downloadURL}
                alt={doc.label}
                className="max-w-full max-h-[68vh] object-contain mx-auto"
              />
            ) : isPdf ? (
              <iframe
                src={`${uploadedDoc?.url || uploadedDoc?.downloadURL}#toolbar=0`}
                title={doc.label}
                className="w-full h-[65vh] border-0 rounded-lg bg-white"
              />
            ) : (
              <iframe
                src={uploadedDoc?.url || uploadedDoc?.downloadURL}
                title={doc.label}
                className="w-full h-[65vh] border-0 rounded-lg bg-white"
              />
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setShowPreviewModal(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              Close Preview
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
