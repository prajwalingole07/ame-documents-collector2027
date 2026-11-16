import React, { useState, useEffect } from 'react';
import {
  Search,
  FileText,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Archive,
  FolderOpen,
  Clock,
  Loader2,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { subscribeStudents } from '../../firebase/studentService';
import {
  approveDocument,
  rejectDocument,
  subscribeAllDocumentsMap,
} from '../../firebase/documentService';
import { getDocumentFileUrl } from '../../firebase/fileStore';
import {
  downloadStudentZip,
  downloadDocumentFile,
  getStandardDocFileName,
  formatDate,
  formatFileSize,
} from '../../utils/helpers';
import { getRequiredDocuments } from '../../utils/documentRequirements';
import StatusBadge from '../common/StatusBadge';
import Modal from '../common/Modal';
import toast from 'react-hot-toast';

export default function DocumentVerification() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [downloadingZip, setDownloadingZip] = useState(false);

  // Live data
  const [docsMap, setDocsMap] = useState({});
  const [live, setLive] = useState(false);
  const [syncError, setSyncError] = useState('');

  // In-page preview modal
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [downloadingDocKey, setDownloadingDocKey] = useState('');

  // Scrutiny review action modals
  const [approvingItem, setApprovingItem] = useState(null);
  const [approvalRemarks, setApprovalRemarks] = useState('');
  const [rejectingItem, setRejectingItem] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  // Live student roster. Every registration / edit appears instantly.
  useEffect(() => {
    const unsub = subscribeStudents(
      (all) => {
        setStudents(all);
        setLoading(false);
        setLive(true);
        setSyncError('');
        setSelectedStudent((current) => {
          if (all.length === 0) return null;
          if (!current) return all[0];
          const exists = all.find((s) => s.regNo.toString() === current.regNo.toString());
          return exists || all[0];
        });
      },
      (err) => {
        console.warn('Student live sync error:', err);
        setLoading(false);
        setLive(false);
        setSyncError(err.message || 'Live student sync is offline.');
      }
    );
    return () => unsub();
  }, []);

  // Live document metadata for every student.
  useEffect(() => {
    const unsub = subscribeAllDocumentsMap(
      (map) => {
        setDocsMap(map);
        setLive(true);
        setSyncError('');
      },
      (err) => {
        console.warn('Document live sync error:', err);
        setLive(false);
        setSyncError(err.message || 'Live document sync is offline.');
      }
    );
    return () => unsub();
  }, []);

  const selectedRegNo = selectedStudent?.regNo?.toString() || '';
  const studentDocs = selectedRegNo ? docsMap[selectedRegNo] || {} : {};

  // Clear a preview if the selected student changes.
  useEffect(() => {
    setPreviewDoc(null);
    setPreviewUrl('');
    setLoadingPreview(false);
  }, [selectedRegNo]);

  // Filter students by Name or Registration / Receipt number
  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.name?.toLowerCase().includes(q) ||
      s.regNo?.toString().toLowerCase().includes(q) ||
      s.contact1?.toString().includes(q) ||
      s.category?.toLowerCase().includes(q)
    );
  });

  // Handle direct Enter key in search box to select the first matching student immediately
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && filteredStudents.length > 0) {
      setSelectedStudent(filteredStudents[0]);
      toast.success(`Selected student: ${filteredStudents[0].name}`);
    }
  };

  // 1-Click ZIP Download for this student
  const handleDownloadAllZip = async () => {
    if (!selectedStudent) return;
    const docEntries = Object.entries(studentDocs).filter(
      ([_, d]) => d && d.status && d.status !== 'NOT_UPLOADED'
    );
    if (docEntries.length === 0) {
      toast.error('No uploaded documents found for this candidate to download');
      return;
    }

    setDownloadingZip(true);
    try {
      await downloadStudentZip(selectedStudent.regNo, selectedStudent.name, studentDocs);
      toast.success(`ZIP downloaded with official filenames for ${selectedStudent.name}`);
    } catch (err) {
      toast.error('Failed to create ZIP: ' + err.message);
    } finally {
      setDownloadingZip(false);
    }
  };

  // Mark Correct (Approve)
  const handleApprove = async () => {
    if (!approvingItem || !selectedStudent) return;
    setProcessing(true);
    try {
      await approveDocument(
        selectedStudent.regNo,
        approvingItem.docKey,
        'ame2027',
        approvalRemarks.trim()
      );
      toast.success('Document marked Correct (Approved)');
      setApprovingItem(null);
      setApprovalRemarks('');
    } catch (err) {
      toast.error('Approval failed: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  // Mark Incorrect (Reject & Request Re-upload)
  const handleReject = async () => {
    if (!rejectingItem || !selectedStudent) return;
    if (!rejectionReason.trim()) {
      toast.error('Please specify why this document is incorrect');
      return;
    }
    setProcessing(true);
    try {
      await rejectDocument(
        selectedStudent.regNo,
        rejectingItem.docKey,
        'ame2027',
        rejectionReason.trim()
      );
      toast.success('Document marked Incorrect (Re-upload requested)');
      setRejectingItem(null);
      setRejectionReason('');
    } catch (err) {
      toast.error('Rejection failed: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  // Open the on-page preview (loads chunked files from the cloud first).
  const handlePreview = async (docObj, docKey) => {
    setPreviewDoc({ ...docObj, docKey });
    setPreviewUrl('');
    setLoadingPreview(true);
    try {
      const url = await getDocumentFileUrl(docObj);
      if (!url) throw new Error('No preview available for this document.');
      setPreviewUrl(url);
    } catch (err) {
      toast.error('Preview failed: ' + err.message);
      setPreviewDoc(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  // Download a single document with its official filename.
  const handleDownloadOne = async (docObj, docKey) => {
    setDownloadingDocKey(docKey);
    try {
      await downloadDocumentFile(docObj, docKey, docObj?.fileName);
      toast.success('Download started');
    } catch (err) {
      toast.error('Download failed: ' + err.message);
    } finally {
      setDownloadingDocKey('');
    }
  };

  // Uploaded documents entries
  const docEntries = Object.entries(studentDocs).filter(
    ([_, d]) => d && d.status && d.status !== 'NOT_UPLOADED'
  );

  // Required documents for this candidate's category
  const requiredDocs = selectedStudent
    ? getRequiredDocuments(selectedStudent.category || 'OPEN', false)
    : [];

  const hasFile = (docObj) => Boolean(docObj?.fileId || docObj?.url || docObj?.downloadURL);

  const isImage = (docObj) =>
    Boolean(
      docObj?.fileType?.startsWith('image/') ||
        docObj?.fileName?.match(/\.(jpg|jpeg|png|webp)$/i) ||
        (docObj?.url && docObj.url.startsWith('data:image/'))
    );

  const isPdf = (docObj) =>
    Boolean(
      docObj?.fileType === 'application/pdf' ||
        docObj?.fileName?.match(/\.pdf$/i) ||
        (docObj?.url && docObj.url.startsWith('data:application/pdf'))
    );

  return (
    <div className="space-y-5">
      {/* Search and Quick Lookup Header */}
      <div className="glass-panel rounded-3xl p-5 shadow-sm border border-white/80 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Student Document Verification &amp; Scrutiny</span>
            <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2.5 py-0.5 rounded-full border border-blue-200">
              Admission 2027
            </span>
            {live ? (
              <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                <Wifi className="w-3 h-3" /> Live
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full border border-slate-200">
                <WifiOff className="w-3 h-3" /> Connecting
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Select a student from the list or enter a Receipt Number / Candidate Name to review documents.
          </p>
        </div>

        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Type student name or receipt number & press Enter..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="w-full pl-10 pr-24 py-2.5 rounded-2xl bg-white/90 border border-slate-200 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded-lg font-bold"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {syncError && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900 flex items-start gap-2">
          <WifiOff className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Cloud sync warning:</strong> {syncError} Showing the last loaded data. Check your
            internet connection or the Firestore rules.
          </span>
        </div>
      )}

      {/* Two Column Layout: Student Roster (Left 4 cols) & Scrutiny Panel (Right 8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Student List */}
        <div className="lg:col-span-4 glass-panel rounded-3xl p-4 shadow-sm border border-white/80 flex flex-col max-h-[46vh] md:max-h-[78vh]">
          <div className="pb-3 border-b border-slate-200/60 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Students ({filteredStudents.length})
              </span>
              <span className="text-[10px] text-slate-400">Click to load documents</span>
            </div>
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border ${
                live
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-50 text-slate-500 border-slate-200'
              }`}
              title={live ? 'Connected to Cloud Firestore' : 'Connecting to Cloud Firestore'}
            >
              {live ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {live ? 'Live' : 'Offline'}
            </span>
          </div>

          <div className="overflow-y-auto flex-1 mt-3 space-y-2 scrollbar-thin pr-1">
            {loading ? (
              <div className="text-center py-12 text-xs text-slate-400">Loading student directory...</div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-12 px-3">
                <FolderOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-600">No student found</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Matching "{searchQuery}". Check the receipt number or import an Excel sheet.
                </p>
              </div>
            ) : (
              filteredStudents.map((st) => {
                const isSelected = selectedStudent?.regNo?.toString() === st.regNo?.toString();
                const stDocs = docsMap[st.regNo?.toString()] || {};
                const uploadedCount = Object.values(stDocs).filter(
                  (d) => d && d.status && d.status !== 'NOT_UPLOADED'
                ).length;

                return (
                  <div
                    key={st.regNo}
                    onClick={() => setSelectedStudent(st)}
                    className={`p-3.5 rounded-2xl cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/25 scale-[1.01]'
                        : 'bg-white/80 hover:bg-white text-slate-800 border-slate-200/80 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-xs truncate max-w-[170px]">{st.name}</p>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isSelected ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {st.category || 'OPEN'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-1.5 text-[11px] opacity-90">
                      <span>Receipt: <strong>{st.regNo}</strong></span>
                      <span className={`font-semibold ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                        {uploadedCount > 0 ? (
                          <span className={isSelected ? 'text-amber-200 font-bold' : 'text-emerald-700 font-bold'}>
                            {uploadedCount} doc(s) uploaded
                          </span>
                        ) : (
                          <span className="text-slate-400">0 docs</span>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Selected Student's Documents & Scrutiny Review */}
        <div className="lg:col-span-8 space-y-4">
          {!selectedStudent ? (
            <div className="glass-panel rounded-3xl p-16 text-center border border-white/80">
              <FolderOpen className="w-14 h-14 text-slate-300 mx-auto mb-3" />
              <p className="text-base font-bold text-slate-700">Select a candidate from the left roster</p>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Or type their Name or Receipt Number in the top search box to view their uploaded admission certificates.
              </p>
            </div>
          ) : (
            <>
              {/* Selected Candidate Banner */}
              <div className="glass-panel rounded-3xl p-5 shadow-sm border border-white/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-blue-500/20 flex-shrink-0">
                    {selectedStudent.name?.charAt(0) || 'S'}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight truncate">
                      {selectedStudent.name}
                    </h3>
                    <div className="flex items-center flex-wrap gap-2 mt-0.5 text-xs text-slate-500 font-medium">
                      <span>
                        Receipt / Reg: <strong className="text-blue-900 font-bold">{selectedStudent.regNo}</strong>
                      </span>
                      <span>•</span>
                      <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full text-[10px] border border-amber-200">
                        Category: {selectedStudent.category || 'OPEN'}
                      </span>
                      <span>•</span>
                      <span>Mobile: {selectedStudent.contact1 || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* 1-Click ZIP Download for this Candidate */}
                <button
                  onClick={handleDownloadAllZip}
                  disabled={downloadingZip || docEntries.length === 0}
                  className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-50 flex-shrink-0"
                  title="Download all certificates in one standard ZIP archive"
                >
                  {downloadingZip ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Packaging ZIP...</span>
                    </>
                  ) : (
                    <>
                      <Archive className="w-4 h-4" />
                      <span>Download All Documents (ZIP)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Uploaded Documents List */}
              <div className="glass-panel rounded-3xl p-5 shadow-sm border border-white/80">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200/60">
                  <div>
                    <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                      Uploaded Documents ({docEntries.length})
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Preview on page or download individually with official standard names
                    </p>
                  </div>
                  <span className="text-xs bg-slate-100 text-slate-700 font-bold px-2.5 py-1 rounded-xl">
                    Status: {selectedStudent.applicationStatus || 'IN_PROGRESS'}
                  </span>
                </div>

                {docEntries.length === 0 ? (
                  <div className="py-12 text-center">
                    <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-600">No documents uploaded yet by this student.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      The candidate has not submitted any scanned certificates so far.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {docEntries.map(([key, d]) => (
                      <div
                        key={key}
                        className="bg-white/80 rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-blue-300 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h5 className="font-bold text-xs text-slate-900 capitalize">
                              {key.replace(/_/g, ' ')}
                            </h5>
                            <StatusBadge status={d.status} />
                            {Number.isInteger(d.chunkCount) && d.chunkCount > 0 && (
                              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-100">
                                Cloud saved
                              </span>
                            )}
                            <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-bold border border-blue-100">
                              Official Name: "{getStandardDocFileName(key, d.fileName)}"
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-500 mt-1 truncate">
                            File: {d.fileName || `${key}.pdf`} ({formatFileSize(d.fileSize)}) • Uploaded:{' '}
                            {formatDate(d.uploadDate)}
                          </p>

                          {d.rejectionReason && (
                            <p className="text-[11px] text-amber-800 font-semibold mt-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 inline-block">
                              Discrepancy Note: {d.rejectionReason}
                            </p>
                          )}
                          {d.remarks && (
                            <p className="text-[11px] text-emerald-800 font-semibold mt-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 inline-block">
                              Approval Remarks: {d.remarks}
                            </p>
                          )}
                        </div>

                        {/* Actions for this document */}
                        <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap">
                          {/* On-Page Preview */}
                          {hasFile(d) && (
                            <button
                              type="button"
                              onClick={() => handlePreview(d, key)}
                              className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs flex items-center gap-1 transition-colors border border-blue-200/60"
                              title="Preview on current page"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Preview</span>
                            </button>
                          )}

                          {/* Single Download with Official Standardized Name */}
                          {hasFile(d) && (
                            <button
                              type="button"
                              onClick={() => handleDownloadOne(d, key)}
                              disabled={downloadingDocKey === key}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors border border-slate-200 disabled:opacity-60"
                              title={`Download as "${getStandardDocFileName(key, d.fileName)}"`}
                            >
                              {downloadingDocKey === key ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Download className="w-3.5 h-3.5" />
                              )}
                              <span>Download</span>
                            </button>
                          )}

                          {/* Correct (Approve) Button */}
                          <button
                            onClick={() => {
                              setApprovingItem({ ...d, docKey: key });
                              setApprovalRemarks('');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1 transition-colors"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Correct
                          </button>

                          {/* Incorrect (Reject) Button */}
                          <button
                            onClick={() => {
                              setRejectingItem({ ...d, docKey: key });
                              setRejectionReason('');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm flex items-center gap-1 transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Incorrect
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Category Document Checklist Overview */}
              <div className="glass-panel rounded-3xl p-5 shadow-sm border border-white/80">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200/60">
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                    Category Checklist ({selectedStudent.category || 'OPEN'} Quota)
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Overview of all mandatory admission certificates
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {requiredDocs.map((req) => {
                    const isUploaded = Boolean(
                      studentDocs[req.key] &&
                        studentDocs[req.key].status &&
                        studentDocs[req.key].status !== 'NOT_UPLOADED'
                    );
                    const docObj = studentDocs[req.key];
                    const docStatus = docObj?.status || 'PENDING';

                    return (
                      <div
                        key={req.key}
                        className={`p-3 rounded-2xl border text-xs flex items-center justify-between gap-2 ${
                          isUploaded
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                            : req.mandatory
                            ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="font-bold truncate">{req.label}</p>
                          <p className="text-[10px] opacity-75">
                            {req.mandatory ? '★ Mandatory' : 'Optional'} • Download Name: "{getStandardDocFileName(req.key)}"
                          </p>
                        </div>
                        {isUploaded ? (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                              {docStatus}
                            </span>
                            {hasFile(docObj) && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handlePreview(docObj, req.key)}
                                  className="p-1 rounded bg-white text-emerald-800 hover:bg-emerald-100"
                                  title="Preview"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadOne(docObj, req.key)}
                                  disabled={downloadingDocKey === req.key}
                                  className="p-1 rounded bg-white text-emerald-800 hover:bg-emerald-100 disabled:opacity-60"
                                  title="Download"
                                >
                                  {downloadingDocKey === req.key ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Download className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full flex-shrink-0">
                            Missing
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* On-Page Embedded Document Preview Modal (No New Tab) */}
      <Modal
        isOpen={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
        title={`Document Preview: ${previewDoc?.docKey?.replace(/_/g, ' ') || 'Certificate'}`}
        maxWidth="max-w-4xl"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 border-b pb-2 gap-3 flex-wrap">
            <span>
              <strong>Candidate:</strong> {selectedStudent?.name} ({selectedStudent?.regNo}) •{' '}
              <strong>File:</strong> {previewDoc?.fileName || 'document'}
            </span>
            <button
              type="button"
              onClick={() => handleDownloadOne(previewDoc, previewDoc?.docKey)}
              disabled={downloadingDocKey === previewDoc?.docKey}
              className="text-blue-600 hover:underline flex items-center gap-1 font-semibold disabled:opacity-60"
            >
              <Download className="w-3.5 h-3.5" /> Download as "{getStandardDocFileName(previewDoc?.docKey, previewDoc?.fileName)}"
            </button>
          </div>

          <div className="w-full bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center min-h-[180px] sm:min-h-[440px] max-h-[52vh] sm:max-h-[72vh]">
            {loadingPreview ? (
              <div className="text-center text-slate-300 text-xs flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Loading document from the cloud...</span>
              </div>
            ) : !previewUrl ? (
              <div className="text-center text-slate-300 text-xs">
                No preview available. Please download the file instead.
              </div>
            ) : isImage(previewDoc) ? (
              <img
                src={previewUrl}
                alt={previewDoc?.docKey}
                className="max-w-full max-h-[48vh] sm:max-h-[70vh] object-contain mx-auto"
              />
            ) : isPdf(previewDoc) ? (
              <iframe
                src={`${previewUrl}#toolbar=0`}
                title={previewDoc?.docKey}
                className="w-full h-[48vh] sm:h-[68vh] border-0 rounded-xl bg-white"
              />
            ) : (
              <iframe
                src={previewUrl}
                title={previewDoc?.docKey}
                className="w-full h-[48vh] sm:h-[68vh] border-0 rounded-xl bg-white"
              />
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setPreviewDoc(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              Close Preview
            </button>
          </div>
        </div>
      </Modal>

      {/* Correct Approval Remarks Modal */}
      <Modal
        isOpen={Boolean(approvingItem)}
        onClose={() => setApprovingItem(null)}
        title="Approve Document (Mark Correct)"
      >
        <div className="space-y-3.5">
          <p className="text-xs text-slate-600">
            Confirm approval for{' '}
            <strong className="text-slate-900">{approvingItem?.docKey?.replace(/_/g, ' ')}</strong> of student {selectedStudent?.name}.
          </p>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Remarks (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Scrutiny verified against merit list"
              value={approvalRemarks}
              onChange={(e) => setApprovalRemarks(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setApprovingItem(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleApprove}
              disabled={processing}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow disabled:opacity-60"
            >
              {processing ? 'Saving...' : 'Confirm Correct'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Incorrect Re-upload Reason Modal */}
      <Modal
        isOpen={Boolean(rejectingItem)}
        onClose={() => setRejectingItem(null)}
        title="Mark Incorrect & Request Student Re-upload"
      >
        <div className="space-y-3.5">
          <p className="text-xs text-slate-600">
            Specify the discrepancy so the candidate can re-upload a compliant certificate.
          </p>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Discrepancy / Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Blurry photo, expired validity date, or missing stamp"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setRejectingItem(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              disabled={processing}
              className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow disabled:opacity-60"
            >
              {processing ? 'Saving...' : 'Request Re-upload'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
