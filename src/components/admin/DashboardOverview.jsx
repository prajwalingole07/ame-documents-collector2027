import React, { useState, useEffect } from 'react';
import { subscribeStudents } from '../../firebase/studentService';
import { subscribeAllDocumentsMap, flattenDocuments } from '../../firebase/documentService';
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
  CartesianGrid,
} from 'recharts';
import {
  Users,
  FileUp,
  CheckCircle,
  XCircle,
  Clock,
  Award,
  AlertCircle,
  RefreshCw,
  FolderOpen,
  Wifi,
  WifiOff,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';

const COLORS = ['#6366F1', '#06B6D4', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#14B8A6', '#F97316'];

const StatCard = ({ label, value, icon: Icon, gradient, glow }) => (
  <div className="glass-card glass-card-hover rounded-2xl p-4 relative overflow-hidden group">
    <div
      className={`absolute -right-6 -top-7 w-24 h-24 rounded-full bg-gradient-to-br ${glow} blur-xl opacity-70 pointer-events-none group-hover:scale-125 transition-transform duration-500`}
    />
    <div className="relative flex items-start justify-between gap-2">
      <div
        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0`}
      >
        <Icon size={18} />
      </div>
      <span className="inline-flex items-center gap-1 text-[8px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
        <span className="status-dot bg-emerald-500" /> Live
      </span>
    </div>
    <p className="relative mt-4 font-display text-[1.7rem] leading-none font-extrabold text-ink">
      {value}
    </p>
    <p className="relative mt-1 text-[9px] font-extrabold uppercase tracking-[0.11em] text-slate-500">
      {label}
    </p>
  </div>
);

export default function DashboardOverview({ onNavigateTab }) {
  const [studentsList, setStudentsList] = useState([]);
  const [docsMap, setDocsMap] = useState({});
  const [live, setLive] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
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

  // Real-time Firestore subscriptions: every upload, approval or registration
  // is reflected here immediately on every device, with no refresh required.
  useEffect(() => {
    const handleError = (err) => {
      console.warn('Dashboard live sync error:', err);
      setLive(false);
      setSyncError(err.message || 'Live sync is offline.');
    };

    const unsubStudents = subscribeStudents(
      (students) => {
        setStudentsList(students);
        setLive(true);
        setSyncError('');
        setLastUpdated(new Date());
      },
      handleError
    );

    const unsubDocs = subscribeAllDocumentsMap(
      (map) => {
        setDocsMap(map);
        setLive(true);
        setSyncError('');
        setLastUpdated(new Date());
      },
      handleError
    );

    return () => {
      unsubStudents();
      unsubDocs();
    };
  }, []);

  useEffect(() => {
    const docsList = flattenDocuments(docsMap);
    let approved = 0;
    let rejected = 0;
    let pending = 0;
    let uploaded = 0;
    const catMap = {};

    studentsList.forEach((s) => {
      const cat = (s.category || 'OPEN').toUpperCase().trim();
      catMap[cat] = (catMap[cat] || 0) + 1;
    });

    docsList.forEach((d) => {
      if (!d.status || d.status === 'NOT_UPLOADED') return;
      uploaded += 1;
      if (d.status === 'APPROVED') approved += 1;
      else if (d.status === 'RE_UPLOAD_REQUIRED' || d.status === 'REJECTED') rejected += 1;
      else pending += 1;
    });

    let completeCount = 0;
    studentsList.forEach((s) => {
      if (s.applicationStatus === 'COMPLETED' || s.applicationStatus === 'SUBMITTED') {
        completeCount += 1;
      }
    });

    setStats({
      totalStudents: studentsList.length,
      totalDocs: uploaded,
      docsApproved: approved,
      docsRejected: rejected,
      docsPending: pending,
      studentsComplete: completeCount,
      studentsIncomplete: Math.max(0, studentsList.length - completeCount),
    });

    setCategoryData(Object.entries(catMap).map(([name, value]) => ({ name, value })));
    setRecentStudents(studentsList.slice(0, 8));
  }, [studentsList, docsMap]);

  const docDistributionData = [
    { name: 'Approved', value: stats.docsApproved, color: '#10B981' },
    { name: 'Pending', value: stats.docsPending, color: '#F59E0B' },
    { name: 'Re-upload', value: stats.docsRejected, color: '#F43F5E' },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* welcome band */}
      <div className="glass-panel glass-sheen rounded-[1.6rem] p-4 sm:p-6 relative overflow-hidden animate-rise">
        <div className="absolute -right-16 -top-24 w-72 h-72 rounded-full bg-gradient-to-br from-indigo-500/15 via-cyan-400/10 to-fuchsia-400/10 blur-2xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-[0.18em] text-indigo-600">
              <Sparkles className="w-3 h-3" />
              Admission scrutiny · 2027
            </p>
            <h2 className="mt-1.5 font-display text-xl sm:text-[1.55rem] font-extrabold text-ink leading-tight">
              {greeting}, <span className="aurora-text">Admission Office</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-1 font-medium">
              Every registration, upload and verification decision, live from the cloud.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[9px] font-extrabold uppercase tracking-[0.1em] border backdrop-blur ${
                live && !syncError
                  ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-800 border-amber-500/20'
              }`}
            >
              {live && !syncError ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              {live && !syncError ? 'Live cloud sync' : 'Reconnecting'}
            </span>
            <button
              onClick={() => setLastUpdated(new Date())}
              className="btn-soft !py-2 !px-3"
              title="The dashboard updates automatically; this refreshes the timestamp."
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {lastUpdated && (
          <div className="relative mt-3 flex items-center gap-2 text-[9px] font-semibold text-slate-400">
            <span className="status-dot bg-emerald-500 live-dot" />
            Last live update {lastUpdated.toLocaleTimeString('en-IN')}
          </div>
        )}
      </div>

      {syncError && (
        <div className="rounded-2xl border border-amber-300/60 bg-amber-50/75 backdrop-blur px-4 py-3 text-[11px] text-amber-900">
          <p className="font-extrabold">Live sync warning</p>
          <p className="mt-0.5 leading-relaxed">
            {syncError} Check the Firestore rules / internet connection. Data resumes automatically
            when the connection returns.
          </p>
        </div>
      )}

      {/* stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total registered" value={stats.totalStudents} icon={Users} gradient="from-indigo-500 to-violet-600" glow="from-indigo-400/40 to-violet-400/10" />
        <StatCard label="Documents uploaded" value={stats.totalDocs} icon={FileUp} gradient="from-sky-500 to-cyan-500" glow="from-sky-400/40 to-cyan-400/10" />
        <StatCard label="Approved / correct" value={stats.docsApproved} icon={CheckCircle} gradient="from-emerald-500 to-teal-500" glow="from-emerald-400/40 to-teal-400/10" />
        <StatCard label="Pending review" value={stats.docsPending} icon={Clock} gradient="from-amber-500 to-orange-500" glow="from-amber-400/40 to-orange-400/10" />
        <StatCard label="Needs re-upload" value={stats.docsRejected} icon={XCircle} gradient="from-rose-500 to-red-500" glow="from-rose-400/40 to-red-400/10" />
        <StatCard label="Applications complete" value={stats.studentsComplete} icon={Award} gradient="from-teal-500 to-emerald-500" glow="from-teal-400/40 to-emerald-400/10" />
        <StatCard label="Incomplete applications" value={stats.studentsIncomplete} icon={AlertCircle} gradient="from-orange-500 to-amber-500" glow="from-orange-400/40 to-amber-400/10" />
        <StatCard label="Active categories" value={categoryData.length} icon={FolderOpen} gradient="from-fuchsia-500 to-pink-500" glow="from-fuchsia-400/40 to-pink-400/10" />
      </div>

      {/* charts — stacked on phones/tablets so donut labels never clip,
          two-up only once the content column is genuinely wide (xl+) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-display text-sm font-extrabold text-ink">Category-wise quotas</h3>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">Registered candidates by category</p>
            </div>
            <span className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <PieChart className="w-4 h-4" />
            </span>
          </div>
          <div className="h-60">
            {categoryData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-2 text-xs text-slate-400">
                <FolderOpen className="w-8 h-8 text-slate-300" />
                No students imported yet.
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
                    innerRadius={48}
                    outerRadius={78}
                    paddingAngle={3}
                    cornerRadius={6}
                    isAnimationActive={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(255,255,255,0.8)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-display text-sm font-extrabold text-ink">Scrutiny progress</h3>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">Document verification distribution</p>
            </div>
            <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={docDistributionData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="rgba(99,102,241,0.12)" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#5c6584', fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 10, fill: '#8b93ad' }}
                  axisLine={false}
                  tickLine={false}
                  width={30}
                />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.35)' }} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} isAnimationActive={false}>
                  {docDistributionData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* recent students */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/60 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-sm font-extrabold text-ink">Recently registered students</h3>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Newest candidates in the cloud roster</p>
          </div>
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('students')}
              className="btn-soft !py-1.5 !px-2.5 !text-[10px]"
            >
              View all
              <ArrowUpRight className="w-3 h-3 text-indigo-600" />
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px]">
            <thead className="bg-white/30 border-b border-white/60 text-slate-500 font-extrabold uppercase">
              <tr>
                <th className="px-4 py-3">Reg no</th>
                <th className="px-4 py-3">Student name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/50">
              {recentStudents.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-10 text-slate-400 font-medium">
                    No students found. Import an Excel spreadsheet to begin.
                  </td>
                </tr>
              ) : (
                recentStudents.map((st) => (
                  <tr key={st.regNo} className="hover:bg-white/40 transition-colors">
                    <td className="px-4 py-3 font-extrabold text-indigo-700">{st.regNo}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">{st.name}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2 py-1 text-[9px] font-extrabold text-indigo-700">
                        {st.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-medium">{st.contact1 || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/45 px-2 py-1 text-[9px] font-extrabold uppercase tracking-wide text-slate-600">
                        <span className="status-dot bg-indigo-400" />
                        {(st.applicationStatus || 'NOT_STARTED').replace(/_/g, ' ')}
                      </span>
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
