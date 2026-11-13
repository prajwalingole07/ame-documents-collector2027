import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, onSnapshot, getDocs } from 'firebase/firestore';
import { getAllStudents } from '../../firebase/studentService';
import { getAllLocalDocuments } from '../../firebase/documentService';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Users,
  LogIn,
  FileUp,
  CheckCircle,
  XCircle,
  Clock,
  Award,
  AlertCircle,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';
import { formatDateTime } from '../../utils/helpers';

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#F97316'];

const StatCard = ({ label, value, icon: Icon, bg, iconBg }) => (
  <div className={`${bg} rounded-2xl p-4 md:p-5 flex items-center gap-4 shadow-sm border border-black/5`}>
    <div className={`${iconBg} p-3 rounded-xl flex-shrink-0 text-white`}>
      <Icon size={22} />
    </div>
    <div className="min-w-0">
      <p className="text-white text-opacity-80 text-xs font-medium truncate">{label}</p>
      <p className="text-white text-2xl font-black mt-0.5">{value}</p>
    </div>
  </div>
);

export default function DashboardOverview({ onNavigateTab }) {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalDocs: 0,
    docsApproved: 0,
    docsRejected: 0,
    docsPending: 0,
    studentsComplete: 0,
    studentsIncomplete: 0,
  });
  const [categoryData, setCategoryData] = useState([]);
  const [recentStudents, setRecentStudents] = useState([]);
  const [recentDocs, setRecentDocs] = useState([]);

  const computeMetrics = (studentsList, docsList) => {
    let approved = 0;
    let rejected = 0;
    let pending = 0;
    const catMap = {};

    studentsList.forEach((s) => {
      const cat = (s.category || 'OPEN').toUpperCase().trim();
      catMap[cat] = (catMap[cat] || 0) + 1;
    });

    docsList.forEach((d) => {
      if (d.status === 'APPROVED') approved++;
      else if (d.status === 'RE_UPLOAD_REQUIRED' || d.status === 'REJECTED') rejected++;
      else pending++;
    });

    let completeCount = 0;
    studentsList.forEach((s) => {
      if (s.applicationStatus === 'COMPLETED' || s.applicationStatus === 'SUBMITTED') {
        completeCount++;
      }
    });

    setStats({
      totalStudents: studentsList.length,
      totalDocs: docsList.length,
      docsApproved: approved,
      docsRejected: rejected,
      docsPending: pending,
      studentsComplete: completeCount,
      studentsIncomplete: Math.max(0, studentsList.length - completeCount),
    });

    setCategoryData(
      Object.entries(catMap).map(([name, value]) => ({ name, value }))
    );

    setRecentStudents(studentsList.slice(0, 8));
    setRecentDocs(docsList.slice(0, 8));
  };

  const loadData = async () => {
    // 1. Instant local read so admin sees full metrics immediately with 0 second delay & 0 errors
    const localStudents = JSON.parse(localStorage.getItem('ame_local_students') || '[]');
    const localDocs = getAllLocalDocuments();
    computeMetrics(localStudents, localDocs);

    // 2. Background fetch without triggering error toasts
    try {
      const remoteStudents = await getAllStudents();
      const currentDocs = getAllLocalDocuments();
      if (remoteStudents && remoteStudents.length > 0) {
        computeMetrics(remoteStudents, currentDocs);
      }
    } catch (e) {
      console.warn('Dashboard background fetch note:', e.message);
    }
  };

  useEffect(() => {
    loadData();

    // Listen to window storage events so when students upload, admin updates in real-time
    const handleStorageUpdate = () => {
      loadData();
    };

    window.addEventListener('storage', handleStorageUpdate);

    // Real-time Firestore sync if available
    let unsubDocs = () => {};
    try {
      unsubDocs = onSnapshot(
        collection(db, 'student_documents'),
        (snap) => {
          const items = [];
          snap.forEach((docSnap) => {
            const regNo = docSnap.id;
            const data = docSnap.data();
            Object.entries(data).forEach(([docKey, val]) => {
              if (val && typeof val === 'object' && val.status && val.status !== 'NOT_UPLOADED') {
                items.push({ id: `${regNo}_${docKey}`, regNo, docKey, ...val });
              }
            });
          });
          if (items.length > 0) {
            const currentStudents = JSON.parse(localStorage.getItem('ame_local_students') || '[]');
            computeMetrics(currentStudents, items);
          }
        },
        (err) => console.warn('Firestore snapshot note:', err.message)
      );
    } catch (e) {}

    return () => {
      window.removeEventListener('storage', handleStorageUpdate);
      unsubDocs();
    };
  }, []);

  const docDistributionData = [
    { name: 'Approved', value: stats.docsApproved, color: '#10B981' },
    { name: 'Pending Review', value: stats.docsPending, color: '#F59E0B' },
    { name: 'Incorrect (Re-upload)', value: stats.docsRejected, color: '#EF4444' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Refresh */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Scrutiny Overview & Live Statistics</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Admissions Made Easy, Latur — Engineering Document Verification Portal 2027
          </p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Live Data
        </button>
      </div>

      {/* 8 Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <StatCard
          label="Total Registered"
          value={stats.totalStudents}
          icon={Users}
          bg="bg-gradient-to-br from-blue-600 to-blue-700"
          iconBg="bg-blue-500/50"
        />
        <StatCard
          label="Total Uploaded"
          value={stats.totalDocs}
          icon={FileUp}
          bg="bg-gradient-to-br from-indigo-600 to-indigo-700"
          iconBg="bg-indigo-500/50"
        />
        <StatCard
          label="Approved (Correct)"
          value={stats.docsApproved}
          icon={CheckCircle}
          bg="bg-gradient-to-br from-emerald-600 to-emerald-700"
          iconBg="bg-emerald-500/50"
        />
        <StatCard
          label="Pending Review"
          value={stats.docsPending}
          icon={Clock}
          bg="bg-gradient-to-br from-amber-500 to-amber-600"
          iconBg="bg-amber-400/50"
        />
        <StatCard
          label="Needs Re-upload"
          value={stats.docsRejected}
          icon={XCircle}
          bg="bg-gradient-to-br from-rose-600 to-rose-700"
          iconBg="bg-rose-500/50"
        />
        <StatCard
          label="Applications Complete"
          value={stats.studentsComplete}
          icon={Award}
          bg="bg-gradient-to-br from-teal-600 to-teal-700"
          iconBg="bg-teal-500/50"
        />
        <StatCard
          label="Incomplete Applications"
          value={stats.studentsIncomplete}
          icon={AlertCircle}
          bg="bg-gradient-to-br from-orange-500 to-orange-600"
          iconBg="bg-orange-400/50"
        />
        <StatCard
          label="Active Categories"
          value={categoryData.length}
          icon={FolderOpen}
          bg="bg-gradient-to-br from-purple-600 to-purple-700"
          iconBg="bg-purple-500/50"
        />
      </div>

      {/* Visual Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Category Distribution Chart */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 text-sm mb-3">
            Category-wise Student Quotas
          </h3>
          <div className="h-60">
            {categoryData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No students imported yet. Go to Import Students tab.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Verification Status Breakdown */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 text-sm mb-3">
            Verification Scrutiny Progress
          </h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={docDistributionData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {docDistributionData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
            Recently Registered Students
          </h3>
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('students')}
              className="text-xs text-blue-600 hover:underline font-semibold"
            >
              View All Students →
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
              <tr>
                <th className="px-4 py-3">Reg No</th>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentStudents.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-slate-400">
                    No students found. Import an Excel spreadsheet to begin.
                  </td>
                </tr>
              ) : (
                recentStudents.map((st) => (
                  <tr key={st.regNo} className="hover:bg-slate-50/70">
                    <td className="px-4 py-2.5 font-bold text-blue-900">{st.regNo}</td>
                    <td className="px-4 py-2.5 font-semibold text-slate-800">{st.name}</td>
                    <td className="px-4 py-2.5">
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold text-[10px]">
                        {st.category}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{st.contact1 || '-'}</td>
                    <td className="px-4 py-2.5 text-slate-600">
                      {st.applicationStatus || 'NOT_STARTED'}
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
