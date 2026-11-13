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
  Cloud,
  Lock,
} from 'lucide-react';
import { uploadDocument } from '../../firebase/documentService';
import { getDocumentFileUrl } from '../../firebase/fileStore';
import {
  downloadDocumentFile,
  getStandardDocFileName,
  formatDate,
  formatFileSize,
} from '../../utils/helpers';
import StatusBadge from '../common/StatusBadge';
import Modal from '../common/Modal';
import toast from 'react-hot-toast';

export default function DocumentCard({ doc, uploadedDoc, studentRegNo }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const fileInputRef = useRef(null);

  const status = uploadedDoc?.status || 'NOT_UPLOADED';
  const isLocked = status === 'APPROVED' && !doc.allowReplace;
  const hasFile = Boolean(
    uploadedDoc?.fileId || uploadedDoc?.url || uploadedDoc?.downloadURL
  );

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only PDF, JPG, JPEG, PNG or WEBP files are allowed');
      e.target.value = '';
      return;
    }
    if (file.size > 4.5 * 1024 * 1024) {
      toast.error('File size must be less than 4.5 MB');
      e.target.value = '';
      return;
    }

    setUploading(true);
    setProgress(0);
    try {
      await uploadDocument(studentRegNo, doc.key, file, (p) => setProgress(p));
      toast.success(`${doc.label} saved to the cloud successfully!`);
    } catch (err) {
      toast.error('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
      setProgress(0);
      e.target.value = '';
    }
  };

  const openPreview = async () => {
    if (!hasFile) return;
    setLoadingPreview(true);
    try {
      const url = await getDocumentFileUrl(uploadedDoc);
      if (!url) throw new Error('File not available in the cloud yet.');
      setPreviewUrl(url);
      setShowPreviewModal(true);
    } catch (err) {
      toast.error('Could not load preview: ' + err.message);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleDownload = async () => {
    if (!hasFile) return;
    setDownloading(true);
    try {
      await downloadDocumentFile(uploadedDoc, doc.key, uploadedDoc?.fileName);
      toast.success('Download started');
    } catch (err) {
      toast.error('Download failed: ' + err.message);
    } finally {
      setDownloading(false);
    }
  };

  const isImage =
    uploadedDoc?.fileType?.startsWith('image/') ||
    uploadedDoc?.fileName?.match(/\.(jpg|jpeg|png|webp)$/i);
  const isPdf =
    uploadedDoc?.fileType === 'application/pdf' ||
    uploadedDoc?.fileName?.match(/\.pdf$/i);

  const cardTone =
    status === 'APPROVED'
      ? 'border-emerald-400/40 bg-emerald-500/[0.06]'
      : status === 'REJECTED'
      ? 'border-rose-400/40 bg-rose-500/[0.06]'
      : status === 'RE_UPLOAD_REQUIRED'
      ? 'border-orange-400/40 bg-orange-500/[0.06]'
      : status === 'UNDER_VERIFICATION'
      ? 'border-amber-400/35 bg-amber-500/[0.05]'
      : status === 'UPLOADED'
      ? 'border-sky-400/30 bg-sky-500/[0.05]'
      : 'border-white/75 bg-white/40 hover:border-indigo-300/60';

  const tileTone =
    status === 'APPROVED'
      ? 'from-emerald-500 to-teal-500 shadow-emerald-500/25'
      : status === 'REJECTED' || status === 'RE_UPLOAD_REQUIRED'
      ? 'from-orange-500 to-rose-500 shadow-orange-500/25'
      : status === 'UNDER_VERIFICATION'
      ? 'from-amber-500 to-orange-500 shadow-amber-500/25'
      : 'from-indigo-500 via-violet-500 to-cyan-500 shadow-indigo-500/25';

  const uploadBtnClass =
    status === 'NOT_UPLOADED'
      ? 'bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 text-white shadow-md shadow-indigo-500/25 hover:brightness-110'
      : status === 'REJECTED' || status === 'RE_UPLOAD_REQUIRED'
      ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-md shadow-orange-500/25 hover:brightness-110'
      : 'bg-white/55 text-slate-700 border border-white/80 hover:bg-white/80';

  const uploadBtnLabel =
    status === 'NOT_UPLOADED' ? 'Upload' : status === 'REJECTED' ? 'Re-upload' : 'Replace';

  return (
    <div
      className={`glass-card rounded-2xl border p-4 sm:p-5 transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/10 ${cardTone}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={`w-9 h-9 rounded-xl bg-gradient-to-br ${tileTone} text-white flex items-center justify-center flex-shrink-0 shadow-lg`}
          >
            {status === 'APPROVED' ? (
              <CheckCircle className="w-4 h-4" />
            ) : isImage && hasFile ? (
              <ImageIcon className="w-4 h-4" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-slate-800 text-[13px] leading-tight">{doc.label}</h4>
            <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
              {doc.mandatory ? (
                <span className="text-[8px] bg-rose-500/10 text-rose-600 px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wide border border-rose-500/15">
                  ★ Mandatory
                </span>
              ) : (
                <span className="text-[8px] bg-white/50 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border border-white/70">
                  Optional
                </span>
              )}
              {hasFile && (
                <span className="text-[8px] bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wide inline-flex items-center gap-1">
                  <Cloud className="w-2.5 h-2.5" /> Cloud
                </span>
              )}
            </div>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Uploaded file info */}
      {uploadedDoc?.fileName && (
        <div className="rounded-xl border border-white/70 bg-white/45 px-3 py-2.5 mb-3 flex items-center gap-2.5">
          {isImage ? (
            <ImageIcon className="w-4 h-4 text-indigo-500 flex-shrink-0" />
          ) : (
            <FileText className="w-4 h-4 text-rose-500 flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-slate-700 truncate">{uploadedDoc.fileName}</p>
            <p className="text-[9px] text-slate-400 font-medium">
              {formatFileSize(uploadedDoc.fileSize)} · Uploaded {formatDate(uploadedDoc.uploadDate)}
            </p>
          </div>
        </div>
      )}

      {/* Rejection reason */}
      {(status === 'REJECTED' || status === 'RE_UPLOAD_REQUIRED') && uploadedDoc?.rejectionReason && (
        <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 mb-3 flex gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] font-extrabold text-rose-700 uppercase tracking-wide">Correction required</p>
            <p className="text-[11px] text-rose-700/90 mt-0.5 leading-relaxed">{uploadedDoc.rejectionReason}</p>
          </div>
        </div>
      )}

      {/* Admin remarks */}
      {status === 'APPROVED' && uploadedDoc?.remarks && (
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3 mb-3">
          <p className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wide">
            Admin remarks
          </p>
          <p className="text-[11px] text-emerald-800/90 mt-0.5">{uploadedDoc.remarks}</p>
        </div>
      )}

      {/* Upload progress */}
      {uploading && (
        <div className="mb-3">
          <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-1.5">
            <span>{progress < 95 ? 'Saving to cloud…' : 'Finalizing…'}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-white/50 border border-white/70 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400 rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {!isLocked && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-extrabold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] ${uploadBtnClass}`}
          >
            {status === 'NOT_UPLOADED' ? (
              <Upload className="w-3.5 h-3.5" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            {uploading ? 'Uploading…' : uploadBtnLabel}
          </button>
        )}

        {hasFile && (
          <button
            type="button"
            onClick={openPreview}
            disabled={loadingPreview}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-extrabold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
          >
            <Eye className="w-3.5 h-3.5" /> {loadingPreview ? 'Loading…' : 'Preview'}
          </button>
        )}

        {hasFile && (
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-extrabold bg-violet-500/10 text-violet-700 border border-violet-500/20 hover:bg-violet-500/20 transition-colors disabled:opacity-50"
            title={`Download as "${getStandardDocFileName(doc.key, uploadedDoc?.fileName)}"`}
          >
            <Download className="w-3.5 h-3.5" /> {downloading ? 'Downloading…' : 'Download'}
          </button>
        )}

        {isLocked && (
          <span className="flex items-center gap-1.5 text-[10px] text-emerald-700 font-extrabold px-1">
            <Lock className="w-3.5 h-3.5" /> Approved &amp; locked
          </span>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
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
          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500 border-b border-white/60 pb-3">
            <span>
              <strong className="text-slate-700">File:</strong> {uploadedDoc?.fileName || 'Document'} ({formatFileSize(uploadedDoc?.fileSize)})
            </span>
            <button
              type="button"
              onClick={handleDownload}
              className="text-indigo-600 hover:underline flex items-center gap-1 font-extrabold"
            >
              <Download className="w-3.5 h-3.5" /> Download as "{getStandardDocFileName(doc.key, uploadedDoc?.fileName)}"
            </button>
          </div>

          <div className="w-full bg-[#0b1024]/90 rounded-2xl overflow-hidden flex items-center justify-center min-h-[420px] max-h-[70vh] border border-white/10">
            {isImage ? (
              <img
                src={previewUrl}
                alt={doc.label}
                className="max-w-full max-h-[68vh] object-contain mx-auto"
              />
            ) : isPdf ? (
              <iframe
                src={`${previewUrl}#toolbar=0`}
                title={doc.label}
                className="w-full h-[65vh] border-0 rounded-lg bg-white"
              />
            ) : (
              <iframe
                src={previewUrl}
                title={doc.label}
                className="w-full h-[65vh] border-0 rounded-lg bg-white"
              />
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button onClick={() => setShowPreviewModal(false)} className="btn-soft">
              Close preview
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
