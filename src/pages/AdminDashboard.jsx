import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logout } from '../firebase/authService';
import toast from 'react-hot-toast';
import Header from '../components/common/Header';
import DashboardOverview from '../components/admin/DashboardOverview';
import ImportStudents from '../components/admin/ImportStudents';
import AllStudents from '../components/admin/AllStudents';
import DocumentVerification from '../components/admin/DocumentVerification';
import ExportData from '../components/admin/ExportData';
import AdminSettings from '../components/admin/AdminSettings';
import {
  LayoutDashboard,
  Upload,
  Users,
  FileCheck2,
  Download,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
  { id: 'import', label: 'Import Students (Excel)', icon: Upload },
  { id: 'students', label: 'All Students & Credentials', icon: Users },
  { id: 'verification', label: 'Document Verification', icon: FileCheck2 },
  { id: 'export', label: 'Reports & Exports', icon: Download },
  { id: 'settings', label: 'Admin Settings', icon: Settings },
];

export default function AdminDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [tabHistory, setTabHistory] = useState(['overview']);
  const { session } = useAuth();
  const navigate = useNavigate();

  // Change tab with URL search parameter & history push
  const handleTabChange = (newTab) => {
    if (newTab === activeTab) return;
    setTabHistory((prev) => [...prev, newTab]);
    setSearchParams({ tab: newTab });
  };

  // Back button handler: returns to previous tab, NEVER logs out!
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

  // Handle browser popstate / back button
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab') || 'overview';
      setTabHistory((prev) => (prev[prev.length - 1] !== tab ? [...prev, tab] : prev));
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

  const currentTabObj = TABS.find((t) => t.id === activeTab) || TABS[0];

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col font-sans">
      <div className="sunlight-glow" />
      <Header
        showLogout
        onLogout={handleLogout}
        userInfo={{ name: 'Admin Office', role: 'admin' }}
        showBack={activeTab !== 'overview'}
        onBack={handleBack}
      />

      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Modern Clean Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'w-64' : 'w-20'
          } bg-slate-900 text-slate-300 transition-all duration-300 ease-in-out flex flex-col flex-shrink-0 z-20 shadow-xl border-r border-slate-800`}
        >
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            {sidebarOpen && (
              <div>
                <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block">
                  Admission Scrutiny Panel
                </span>
                <span className="text-xs text-slate-400 font-semibold block">Authorized Admin</span>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors ml-auto"
            >
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1 scrollbar-thin">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  title={!sidebarOpen ? tab.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-bold'
                      : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 ${
                      isActive ? 'text-white' : 'text-slate-400'
                    }`}
                  />
                  {sidebarOpen && <span className="truncate">{tab.label}</span>}
                  {sidebarOpen && isActive && (
                    <ChevronRight className="w-3.5 h-3.5 ml-auto text-blue-200" />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="p-3 border-t border-slate-800">
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              {sidebarOpen && <span>{loggingOut ? 'Signing out...' : 'Sign Out'}</span>}
            </button>
          </div>
        </aside>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-transparent">
          <div className="max-w-6xl mx-auto space-y-5">
            {/* Context Back Button Navigation Bar when not on overview */}
            {activeTab !== 'overview' && (
              <div className="flex items-center justify-between pb-1">
                <button
                  onClick={handleBack}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/90 hover:bg-white text-slate-800 hover:text-blue-700 text-xs font-bold border border-slate-200/80 shadow-sm transition-all hover:scale-105 active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4 text-blue-600" />
                  <span>Back to Previous Tab</span>
                </button>

                <div className="text-xs text-slate-500 font-semibold">
                  Current View: <span className="text-blue-700 font-bold">{currentTabObj.label}</span>
                </div>
              </div>
            )}

            {activeTab === 'overview' && (
              <DashboardOverview onNavigateTab={handleTabChange} />
            )}
            {activeTab === 'import' && <ImportStudents />}
            {activeTab === 'students' && <AllStudents />}
            {activeTab === 'verification' && <DocumentVerification />}
            {activeTab === 'export' && <ExportData />}
            {activeTab === 'settings' && <AdminSettings />}
          </div>
        </main>
      </div>
    </div>
  );
}
