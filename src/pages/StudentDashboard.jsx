import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '../firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { logout } from '../firebase/authService';
import toast from 'react-hot-toast';
import Header from '../components/common/Header';
import StudentProfile from '../components/student/StudentProfile';
import DocumentUpload from '../components/student/DocumentUpload';
import HelpInstructions from '../components/student/HelpInstructions';
import StatusBadge from '../components/common/StatusBadge';
import {
  User,
  Upload,
  HelpCircle,
  Wifi,
  WifiOff,
  RefreshCw,
  Cloud,
  FileCheck2,
  Sparkles,
} from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';

const TABS = [
  { id: 'upload', label: 'Document Submission & Verification', short: 'Documents', icon: Upload },
  { id: 'profile', label: 'My Profile & Status', short: 'My profile', icon: User },
  { id: 'help', label: 'Help & Guidelines', short: 'Help', icon: HelpCircle },
];

export default function StudentDashboard() {
  const { user, loading: authLoading, logout: authLogout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'upload';
  const [studentData, setStudentData] = useState(null);
  const [documents, setDocuments] = useState({});
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState('');
  const [live, setLive] = useState(false);
  const [tabHistory, setTabHistory] = useState(() => [searchParams.get('tab') || 'upload']);

  const setActiveTab = (tabId) => {
    if (tabId === activeTab) return;
    setTabHistory((prev) => [...prev, tabId]);
    setSearchParams({ tab: tabId });
  };

  // Back goes exactly one step back through the tabs. Tabs stay mounted, so
  // any upload, form or checklist work in progress is kept alive.
  const handleBack = () => {
    if (tabHistory.length > 1) {
      const nextHistory = [...tabHistory];
      nextHistory.pop();
      const prevTab = nextHistory[nextHistory.length - 1] || 'upload';
      setTabHistory(nextHistory);
      setSearchParams({ tab: prevTab });
    } else if (activeTab !== 'upload') {
      setSearchParams({ tab: 'upload' });
    } else {
      toast('You are on the Document Submission tab', { icon: 'ℹ️' });
    }
  };

  // Keep the in-app history aligned with the browser back/forward buttons.
  // A popstate moves the browser pointer backwards, so trim our stack to the
  // last matching tab instead of appending a phantom forward entry.
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab') || 'upload';
      setTabHistory((prev) => {
        const idx = prev.lastIndexOf(tab);
        return idx >= 0 ? prev.slice(0, idx + 1) : [...prev, tab];
      });
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    // Wait for AuthProvider to hydrate the session from localStorage before
    // deciding the user is signed out. Without this guard a page refresh on
    // /student/dashboard would bounce the student to the login screen.
    if (authLoading) return;
    if (!user?.regNo) {
      navigate('/student/login');
      return;
    }

    const regStr = user.regNo.toString();

    // Paint from the last known cache instantly, then replace it with the
    // live cloud snapshot. The cache is never used as the source of truth.
    try {
      const cached = JSON.parse(localStorage.getItem(`ame_cloud_cache_student_${regStr}`) || 'null');
      if (cached) setStudentData(cached);
      const cachedDocs = JSON.parse(localStorage.getItem(`ame_cloud_cache_docs_${regStr}`) || '{}');
      if (cachedDocs) setDocuments(cachedDocs);
    } catch (e) {
      // ignore
    }

    let firstSnapshot = true;
    const finishLoading = () => {
      if (firstSnapshot) {
        firstSnapshot = false;
        setLoading(false);
      }
    };

    const unsubStudent = onSnapshot(
      doc(db, 'students', regStr),
      (snap) => {
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() };
          setStudentData(data);
          setSyncError('');
          setLive(true);
          localStorage.setItem(`ame_cloud_cache_student_${regStr}`, JSON.stringify(data));
        } else {
          setSyncError('Your student record was not found in the cloud. Please contact the admin office.');
        }
        finishLoading();
      },
      (err) => {
        console.warn('Student live sync error:', err);
        setSyncError(
          'Live sync is offline. Changes may not appear on other devices until the connection returns. ' +
            (err.message || '')
        );
        setLive(false);
        finishLoading();
      }
    );

    const unsubDocs = onSnapshot(
      doc(db, 'student_documents', regStr),
      (snap) => {
        const data = snap.exists() ? snap.data() : {};
        setDocuments(data);
        setSyncError('');
        setLive(true);
        localStorage.setItem(`ame_cloud_cache_docs_${regStr}`, JSON.stringify(data));
      },
      (err) => {
        console.warn('Document live sync error:', err);
        setSyncError(
          'Document live sync is offline. Uploaded files may not appear on other devices until the connection returns.'
        );
        setLive(false);
      }
    );

    // Fallback: never leave the student staring at a spinner.
    const timer = setTimeout(finishLoading, 5000);

    return () => {
      clearTimeout(timer);
      unsubStudent();
      unsubDocs();
    };
  }, [user, authLoading, navigate]);

  const handleLogout = async () => {
    await logout();
    authLogout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-panel rounded-3xl px-10 py-4">
          <LoadingSpinner text="Connecting to secure cloud portal…" />
        </div>
      </div>
    );
  }

  const docValues = Object.values(documents || {});
  const uploadedCount = docValues.filter(
    (d) => d?.status && d.status !== 'NOT_UPLOADED'
  ).length;
  const approvedCount = docValues.filter((d) => d?.status === 'APPROVED').length;
  const firstName = (studentData?.name || user?.name || 'Student').trim().split(' ')[0];

  return (
    <div className="min-h-[100dvh] relative flex flex-col font-sans">
      <div className="sunlight-glow" />
      <Header
        showLogout
        onLogout={handleLogout}
        userInfo={{ name: studentData?.name || user?.name, role: 'student', regNo: user?.regNo }}
        showBack={activeTab !== 'upload'}
        onBack={handleBack}
      />

      <main className="relative z-10 flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-5 pb-28 sm:py-7">
        {/* welcome banner */}
        <section className="glass-panel glass-sheen rounded-[1.6rem] p-4 sm:p-6 mb-4 sm:mb-5 relative overflow-hidden animate-rise">
          <div className="absolute -right-16 -top-20 w-64 h-64 rounded-full bg-gradient-to-br from-indigo-500/15 via-cyan-400/10 to-transparent blur-2xl pointer-events-none" />
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-3.5 sm:gap-4">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-1.5 text-[8px] sm:text-[9px] font-extrabold uppercase tracking-[0.18em] text-indigo-600">
                <Sparkles className="w-3 h-3" />
                Student workspace · Admissions 2027
              </p>
              <h2 className="mt-1 sm:mt-1.5 font-display text-xl sm:text-[1.8rem] font-extrabold text-ink leading-tight">
                Welcome back, <span className="aurora-text">{firstName}</span>
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/50 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[10px] font-bold text-slate-600">
                  Reg / Receipt: <strong className="text-slate-900">{studentData?.regNo || user?.regNo}</strong>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[10px] font-extrabold text-indigo-700">
                  Category: {studentData?.category || 'OPEN'}
                </span>
                <StatusBadge status={studentData?.applicationStatus || 'IN_PROGRESS'} />
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
              <div className="glass-soft rounded-xl sm:rounded-2xl px-3 sm:px-3.5 py-2 sm:py-2.5 text-center flex-1 sm:flex-none">
                <p className="font-display text-lg sm:text-xl font-extrabold text-slate-900 leading-none">
                  {uploadedCount}
                </p>
                <p className="text-[8px] font-extrabold uppercase tracking-[0.12em] text-slate-500 mt-1">
                  Uploaded
                </p>
              </div>
              <div className="glass-soft rounded-xl sm:rounded-2xl px-3 sm:px-3.5 py-2 sm:py-2.5 text-center flex-1 sm:flex-none">
                <p className="font-display text-lg sm:text-xl font-extrabold text-emerald-600 leading-none">
                  {approvedCount}
                </p>
                <p className="text-[8px] font-extrabold uppercase tracking-[0.12em] text-slate-500 mt-1">
                  Approved
                </p>
              </div>
              <div className="rounded-xl sm:rounded-2xl px-3 sm:px-3.5 py-2 sm:py-2.5 text-center bg-gradient-to-br from-indigo-600 via-violet-600 to-cyan-500 text-white shadow-lg shadow-indigo-500/25 flex-1 sm:flex-none">
                <Cloud className="w-4 h-4 mx-auto" />
                <p className="text-[8px] font-extrabold uppercase tracking-[0.12em] text-white/90 mt-1">
                  Cloud
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* navigation — desktop pills */}
        <div className="hidden sm:flex glass-header rounded-2xl p-1.5 mb-4 items-center justify-between gap-2">
          <div className="flex items-center gap-1 overflow-x-auto flex-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`tab-pill ${isActive ? 'tab-pill-active' : ''}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.short}</span>
                </button>
              );
            })}
          </div>

          <div className="hidden lg:flex items-center gap-2 pr-1.5">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide border ${
                live && !syncError
                  ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-700 border-amber-500/20'
              }`}
            >
              {live && !syncError ? (
                <Wifi className="w-3 h-3" />
              ) : (
                <WifiOff className="w-3 h-3" />
              )}
              {live && !syncError ? 'Live sync' : 'Reconnecting'}
            </span>
          </div>
        </div>

        {syncError && (
          <div className="mb-4 rounded-2xl border border-amber-300/60 bg-amber-50/75 backdrop-blur px-4 py-3 text-[11px] text-amber-900 flex items-start gap-2.5">
            <WifiOff className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold">Cloud sync warning</p>
              <p className="mt-0.5 leading-relaxed">{syncError}</p>
            </div>
          </div>
        )}
        {live && !syncError && (
          <div className="mb-4 hidden sm:flex rounded-2xl border border-emerald-500/20 bg-emerald-500/10 backdrop-blur px-4 py-2.5 text-[10px] font-semibold text-emerald-800 items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>
              Live cloud sync active — every upload and scrutiny decision is shared instantly with the
              admission office.
            </span>
          </div>
        )}

        {/* Tabs remain mounted (only hidden) so uploads and form progress are
            never lost when the student goes one step back. */}
        {TABS.map((tab) => (
          <div
            key={tab.id}
            className={activeTab === tab.id ? 'animate-rise' : 'hidden'}
            aria-hidden={activeTab !== tab.id}
          >
            {tab.id === 'upload' && (
              <DocumentUpload studentData={studentData} documents={documents} />
            )}
            {tab.id === 'profile' && (
              <StudentProfile studentData={studentData} documents={documents} />
            )}
            {tab.id === 'help' && <HelpInstructions />}
          </div>
        ))}
      </main>

      <footer className="relative z-10 px-4 sm:px-6 pb-4 hidden sm:block">
        <div className="max-w-6xl mx-auto glass-header rounded-2xl px-4 py-3 text-center text-[10px] font-semibold text-slate-500">
          ADMISSIONS MADE EASY, LATUR — Student Document Portal 2027
          <span className="mx-2 text-slate-300">|</span>
          Helpline: 94226 11661
          <span className="mx-2 text-slate-300">|</span>
          <span className="inline-flex items-center gap-1">
            <FileCheck2 className="w-3 h-3 text-indigo-500" /> Paperless scrutiny
          </span>
        </div>
      </footer>

      {/* Mobile app bottom navigation */}
      <nav
        className="sm:hidden fixed left-3 right-3 z-40 safe-bottom"
        aria-label="Student portal sections"
      >
        <div className="glass-header rounded-2xl p-1.5 flex items-center gap-1 shadow-xl shadow-indigo-950/15">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex-1 flex flex-col items-center justify-center gap-1 rounded-xl py-2.5 min-h-[50px] text-[9px] font-extrabold uppercase tracking-wide transition-all ${
                  isActive
                    ? 'bg-gradient-to-br from-indigo-600 via-violet-600 to-cyan-500 text-white shadow-lg shadow-indigo-500/30'
                    : 'text-slate-500 active:bg-white/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.short}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
