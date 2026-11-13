import React, { useState } from 'react';
import { Download, FileSpreadsheet, Archive, Search, CheckCircle } from 'lucide-react';
import { getAllStudents, getStudent } from '../../firebase/studentService';
import { db } from '../../firebase/config';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { exportToExcel } from '../../utils/excelUtils';
import { downloadStudentZip } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function ExportData() {
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [searchRegNo, setSearchRegNo] = useState('');
  const [exportingReport, setExportingReport] = useState(false);

  const handleExportAllStudents = async () => {
    setExportingReport(true);
    try {
      const students = await getAllStudents();
      const rows = students.map((s) => ({
        'Registration Number': s.regNo,
        'Full Name': s.name,
        Category: s.category,
        'Date of Birth': s.dob,
        'Student Contact (1)': s.contact1,
        'Parent Contact (2)': s.contact2,
        'Application Status': s.applicationStatus || 'NOT_STARTED',
        'Fee Concession Applied': s.applyFeeConcession ? 'YES' : 'NO',
        'Account Disabled': s.isDisabled ? 'YES' : 'NO',
      }));
      exportToExcel(rows, 'AME_All_Registered_Students_2027.xlsx');
      toast.success('Downloaded All Students Excel Report');
    } catch (err) {
      toast.error('Export failed: ' + err.message);
    } finally {
      setExportingReport(false);
    }
  };

  const handleExportVerificationSummary = async () => {
    setExportingReport(true);
    try {
      const snap = await getDocs(collection(db, 'student_documents'));
      const rows = [];
      snap.forEach((docSnap) => {
        const regNo = docSnap.id;
        const data = docSnap.data();
        Object.entries(data).forEach(([docKey, val]) => {
          if (val && typeof val === 'object' && val.status) {
            rows.push({
              'Student Reg No': regNo,
              'Document Type': docKey,
              'File Name': val.fileName || '-',
              Status: val.status,
              'Approved By': val.approvedBy || '-',
              'Rejection Reason': val.rejectionReason || '-',
              Remarks: val.remarks || '-',
            });
          }
        });
      });
      exportToExcel(rows, 'AME_Document_Verification_Report_2027.xlsx');
      toast.success('Downloaded Verification Report');
    } catch (err) {
      toast.error('Export failed: ' + err.message);
    } finally {
      setExportingReport(false);
    }
  };

  const handleDownloadSingleStudentZip = async (e) => {
    e.preventDefault();
    if (!searchRegNo.trim()) {
      toast.error('Enter student registration number');
      return;
    }
    setDownloadingZip(true);
    try {
      const regNo = searchRegNo.trim();
      const st = await getStudent(regNo);
      if (!st) {
        toast.error(`Student with Reg No ${regNo} not found`);
        return;
      }
      const docSnap = await getDoc(doc(db, 'student_documents', regNo));
      if (!docSnap.exists() || Object.keys(docSnap.data()).length === 0) {
        toast.error(`No uploaded documents found for ${st.name}`);
        return;
      }
      await downloadStudentZip(regNo, st.name, docSnap.data());
      toast.success(`Generated ZIP for ${st.name}!`);
      setSearchRegNo('');
    } catch (err) {
      toast.error('ZIP generation failed: ' + err.message);
    } finally {
      setDownloadingZip(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800">Export Scrutiny Data & Documents</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Generate master Excel rosters, verification reports, or download student certificates in bulk ZIP archives.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Excel Reports Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-50 text-green-700 rounded-xl">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-sm">Master Excel Reports</h3>
              <p className="text-xs text-gray-400">Download formatted admission sheets</p>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={handleExportAllStudents}
              disabled={exportingReport}
              className="w-full flex items-center justify-between p-3.5 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-xl text-xs font-semibold text-gray-700 hover:text-blue-700 transition-colors"
            >
              <span>Export Complete Student Directory</span>
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={handleExportVerificationSummary}
              disabled={exportingReport}
              className="w-full flex items-center justify-between p-3.5 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-xl text-xs font-semibold text-gray-700 hover:text-blue-700 transition-colors"
            >
              <span>Export All Documents Verification Audit</span>
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Individual Student ZIP Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
              <Archive className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-sm">Download Student Document Folder (ZIP)</h3>
              <p className="text-xs text-gray-400">Package all uploaded files for a single student</p>
            </div>
          </div>

          <form onSubmit={handleDownloadSingleStudentZip} className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Student Registration Number
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. 20270001"
                  value={searchRegNo}
                  onChange={(e) => setSearchRegNo(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={downloadingZip}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
            >
              {downloadingZip ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Zipping Documents...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download Student ZIP
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
