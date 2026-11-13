import React, { useState, useEffect } from 'react';
import { Search, Copy, Check, KeyRound, Download, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { getAllStudents } from '../../firebase/studentService';
import { exportStudentCredentials } from '../../utils/excelUtils';
import toast from 'react-hot-toast';

export default function StudentCredentials() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [copiedPwd, setCopiedPwd] = useState(null);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = await getAllStudents();
      setStudents(data);
    } catch (err) {
      toast.error('Failed to load credentials: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleCopy = (text, type, regNo) => {
    navigator.clipboard.writeText(text);
    if (type === 'id') {
      setCopiedId(regNo);
      setTimeout(() => setCopiedId(null), 2000);
      toast.success('Login ID copied to clipboard');
    } else {
      setCopiedPwd(regNo);
      setTimeout(() => setCopiedPwd(null), 2000);
      toast.success('Password copied to clipboard');
    }
  };

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.regNo?.toLowerCase().includes(q) ||
      s.category?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Student Login Credentials</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            View, copy, and export student account credentials generated during Excel import.
          </p>
        </div>
        <button
          onClick={() => exportStudentCredentials(students)}
          className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-xl text-sm font-semibold transition-colors flex-shrink-0"
        >
          <Download className="w-4 h-4" /> Export Credentials to Excel
        </button>
      </div>

      {/* Search & Stats */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by student name, registration number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-1.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div className="text-xs text-gray-500">
          Total Accounts: <span className="font-bold text-gray-800">{students.length}</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Login ID (RegNo)</th>
                <th className="px-4 py-3">Initial Password</th>
                <th className="px-4 py-3">Account Status</th>
                <th className="px-4 py-3 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-gray-400">
                    Loading credentials...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-gray-400">
                    No student credentials found.
                  </td>
                </tr>
              ) : (
                filtered.map((st) => (
                  <tr key={st.regNo} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-semibold text-gray-800">{st.name}</td>
                    <td className="px-4 py-3">
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold text-[11px]">
                        {st.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-blue-900">{st.regNo}</td>
                    <td className="px-4 py-3 font-mono text-gray-700 font-medium">
                      {st.initialPassword || '(Custom/Reset)'}
                    </td>
                    <td className="px-4 py-3">
                      {st.isDisabled ? (
                        <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded font-medium text-[11px]">
                          Disabled
                        </span>
                      ) : (
                        <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded font-medium text-[11px]">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleCopy(st.regNo, 'id', st.regNo)}
                          className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors"
                        >
                          {copiedId === st.regNo ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                          Copy ID
                        </button>
                        {st.initialPassword && (
                          <button
                            onClick={() => handleCopy(st.initialPassword, 'pwd', st.regNo)}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors"
                          >
                            {copiedPwd === st.regNo ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                            Copy Password
                          </button>
                        )}
                      </div>
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
