import React, { useState, useEffect } from 'react';
import { getAllStudents } from '../../firebase/studentService';
import { db } from '../../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { Banknote, Download, Eye, CheckCircle, Clock } from 'lucide-react';
import { exportToExcel } from '../../utils/excelUtils';
import toast from 'react-hot-toast';

export default function FeeConcessionDocuments() {
  const [students, setStudents] = useState([]);
  const [concessionList, setConcessionList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const all = await getAllStudents();
        const feeApplicants = all.filter((s) => s.applyFeeConcession === true);
        setConcessionList(feeApplicants);
      } catch (err) {
        toast.error('Failed to load fee concession list: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleExport = () => {
    const data = concessionList.map((s) => ({
      'Reg No': s.regNo,
      'Student Name': s.name,
      Category: s.category,
      'Contact-1': s.contact1,
      'Contact-2': s.contact2,
      DOB: s.dob,
      'Fee Concession Applied': 'YES',
    }));
    exportToExcel(data, 'AME_Fee_Concession_Applicants.xlsx');
    toast.success('Exported fee concession applicants to Excel');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Government Fee Concession / Scholarship Documents</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Students applying for government fee concession (Income Certificate, Aadhaar Linked Bank, PAN & Ration Card).
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-800 hover:bg-yellow-100 rounded-xl text-sm font-semibold transition-colors flex-shrink-0"
        >
          <Download className="w-4 h-4" /> Export Concession Report
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800 text-sm">
            Total Concession Applicants ({concessionList.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Reg No</th>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Student Mobile</th>
                <th className="px-4 py-3">Parent Mobile</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-gray-400">
                    Loading concession applicants...
                  </td>
                </tr>
              ) : concessionList.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-gray-400">
                    No students have currently opted for Government Fee Concession.
                  </td>
                </tr>
              ) : (
                concessionList.map((st) => (
                  <tr key={st.regNo} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-bold text-blue-900">{st.regNo}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{st.name}</td>
                    <td className="px-4 py-3">
                      <span className="bg-yellow-50 text-yellow-800 px-2 py-0.5 rounded font-semibold text-[11px]">
                        {st.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{st.contact1 || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{st.contact2 || '-'}</td>
                    <td className="px-4 py-3 font-semibold text-blue-700">
                      {st.applicationStatus || 'IN_PROGRESS'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
