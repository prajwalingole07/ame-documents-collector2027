import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logout } from '../firebase/authService';
import toast from 'react-hot-toast';
import Header from '../components/common/Header';

// Admin tabs are code-split and mounted on first visit only. This keeps the
// initial dashboard light (no Excel / ZIP / chart libraries until needed) while
// still preserving half-filled forms when switching tabs.
const DashboardOverview = lazy(() => import('../components/admin/DashboardOverview'));
const ImportStudents = lazy(() => import('../components/admin/ImportStudents'));
const AllStudents = lazy(() => import('../components/admin/AllStudents'));
const DocumentVerification = lazy(() => import('../components/admin/DocumentVerification'));
const ExportData = lazy(() => import('../components/admin/ExportData'));
const AdminSettings = lazy(() => import('../components/admin/AdminSettings'));

function TabLoader() {
  return (
    <div className="glass-panel rounded-3xl border border-white/80 p-10 flex flex-col items-center justify-center gap-3 min-h-[240px]">
      <span className="w-7 h-7 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
      <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
        Loading workspace…
      </p>
    </div>
  );
}
import {
  LayoutDashboard,
  Upload,
  Users,
  FileCheck2,
  Download,
  Settings,
  LogOut,
  ChevronRight,
  Cloud,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard, short: 'Overview' },
  { id: 'import', label: 'Import Students (Excel)', icon: Upload, short: 'Import' },
  { id: 'students', label: 'All Students & Credentials', icon: Users, short: 'Students' },
  { id: 'verification', label: 'Document Verification', icon: FileCheck2, short: 'Verify' },
  { id: 'export', label: 'Reports & Exports', icon: Download, short: 'Reports' },
  { id: 'settings', label: 'Admin Settings', icon: Settings, short: 'Settings' },
];

export default function AdminDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [tabHistory, setTabHistory] = useState(() => [searchParams.get('tab') || 'overview']);
  const [visitedTabs, setVisitedTabs] = useState(
    () => new Set([searchParams.get('tab') || 'overview'])
  );
  const { session } = useAuth();
  const navigate = useNavigate();

  // Mount a tab the first time it is opened, then keep it alive (hidden) so
  // filters, forms and uploads survive back-and-forth navigation.
  useEffect(() => {
    setVisitedTabs((prev) => (prev.has(activeTab) ? prev : new Set(prev).add(activeTab)));
  }, [activeTab]);

  // Change tab with URL search parameter & history push
  const handleTabChange = (newTab) => {
    if (newTab === activeTab) return;
    setTabHistory((prev) => [...prev, newTab]);
    setSearchParams({ tab: newTab });
  };

  // Back button handler: returns to previous tab, NEVER logs out.
  // Tabs stay mounted, so in-progress work on the page is preserved.
  const handleBack = () => {
    if (tabHistory.length > 1) {
      const nextHistory = [...tabHistory];
      nextHistory.pop(); // Remove current
      const prevTab = nextHistory[nextHistory.length - 1] || 'overview';
      setTabHistory(nextHistory);
      setSearchParams({ tab: prevTab });
    } else if (activeTab !== 'overview') {
      setSearchParams({ tab: 'overview' });
    } else {
      toast('You are on the home Dashboard Overview tab', { icon: 'ℹ️' });
    }
  };

  // Handle browser popstate / back button. Trim the in-app stack so it stays
  // aligned with the browser history pointer instead of growing forwards.
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab') || 'overview';
      setTabHistory((prev) => {
        const idx = prev.lastIndexOf(tab);
        return idx >= 0 ? prev.slice(0, idx + 1) : [...prev, tab];
      });
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate('/admin/login');
      toast.success('Logged out successfully');
    } catch (err) {
      toast.error('Logout error: ' + err.message);
    } finally {
      setLoggingOut(false);
    }
  };

  return (    <div className="min-h-[100dvh] relative flex flex-col font-sans">
      <div className="sunlight-glow" />
      <Header
        showLogout
        onLogout={handleLogout}
        userInfo={{ name: 'Admin Office', role: 'admin' }}
        showBack={activeTab !== 'overview'}
        onBack={handleBack}
      />

      <div className="relative z-10 flex-1 w-full max-w-[1500px] mx-auto px-3 sm:px-4 lg:px-6 pt-3 sm:pt-4 pb-6 flex gap-4 lg:gap-5">
        {/* Desktop glass sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'w-[258px]' : 'w-[82px]'
          } hidden lg:flex flex-col flex-shrink-0 sticky top-[84px] h-[calc(100vh-98px)] glass-sidebar rounded-[1.6rem] transition-all duration-300 ease-in-out overflow-hidden`}
        >
          <div className="p-3 flex items-center justify-between gap-2 border-b border-white/55">
            {sidebarOpen ? (
              <div className="pl-1.5 min-w-0">
                <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-indigo-600 truncate">
                  Control center
                </p>
                <p className="text-[11px] font-extrabold text-slate-700 mt-0.5 truncate">
                  Admission 2027
                </p>
              </div>
            ) : (
              <div className="w-full flex justify-center">
                <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/25">
                  <LayoutDashboard className="w-4 h-4" />
                </span>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-700 hover:bg-white/60 transition-colors flex-shrink-0"
              title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {sidebarOpen ? (
                <PanelLeftClose className="w-4 h-4" />
              ) : (
                <PanelLeftOpen className="w-4 h-4" />
              )}
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-1 scrollbar-thin">
            {sidebarOpen && (
              <p className="px-2 pb-1.5 text-[8px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
                Workspace
              </p>
            )}
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  title={!sidebarOpen ? tab.label : undefined}
                  className={`${sidebarOpen ? 'nav-pill' : 'nav-pill justify-center !px-0'} ${
                    isActive ? 'nav-pill-active' : ''
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 ${
                      isActive ? 'text-white' : 'text-indigo-500/80'
                    }`}
                  />
                  {sidebarOpen && (
                    <>
                      <span className="truncate">{tab.label}</span>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto text-white/80" />}
                    </>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="p-2.5 border-t border-white/55">
            {sidebarOpen && (
              <div className="mb-2 rounded-xl border border-white/70 bg-white/40 px-3 py-2.5 flex items-center gap-2">
                <Cloud className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500">
                    Cloud status
                  </p>
                  <p className="text-[10px] font-extrabold text-emerald-700 flex items-center gap-1.5 mt-0.5">
                    <span className="status-dot bg-emerald-500 live-dot" />
                    Live &amp; synced
                  </p>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              title="Sign out"
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[11px] font-extrabold text-rose-600 hover:bg-rose-500/10 transition-colors w-full ${
                !sidebarOpen ? 'justify-center' : ''
              } disabled:opacity-50`}
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              {sidebarOpen && <span>{loggingOut ? 'Signing out…' : 'Sign out'}</span>}
            </button>
          </div>
        </aside>

        {/* Mobile tab bar */}
        <div className="lg:hidden fixed left-3 right-3 z-40 safe-bottom glass-header rounded-2xl px-1.5 py-1.5 flex items-center gap-1 overflow-x-auto shadow-xl shadow-indigo-950/15">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex-1 flex flex-col items-center justify-center gap-1 rounded-xl px-1.5 py-2 min-w-[50px] min-h-[50px] text-[9px] font-extrabold uppercase tracking-wide transition-all ${
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

        {/* Content */}
        <main className="flex-1 min-w-0 pb-28 lg:pb-0">
          <div className="max-w-6xl mx-auto">
            {/* Every tab stays mounted after the first visit, so half-filled
                forms, filters and ongoing uploads survive navigating back. */}
            {TABS.map((tab) =>
              visitedTabs.has(tab.id) ? (
                <div
                  key={tab.id}
                  className={activeTab === tab.id ? 'animate-rise' : 'hidden'}
                  aria-hidden={activeTab !== tab.id}
                >
                  <Suspense fallback={<TabLoader />}>
                    {tab.id === 'overview' && (
                      <DashboardOverview onNavigateTab={handleTabChange} />
                    )}
                    {tab.id === 'import' && <ImportStudents />}
                    {tab.id === 'students' && <AllStudents />}
                    {tab.id === 'verification' && <DocumentVerification />}
                    {tab.id === 'export' && <ExportData />}
                    {tab.id === 'settings' && <AdminSettings />}
                  </Suspense>
                </div>
              ) : null
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
