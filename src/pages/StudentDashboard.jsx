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
import { User, Upload, HelpCircle, LogOut, ArrowLeft } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';

const TABS = [
  { id: 'upload', label: 'Document Submission & Verification', icon: Upload },
  { id: 'profile', label: 'My Profile & Status', icon: User },
  { id: 'help', label: 'Help & Guidelines', icon: HelpCircle },
];

export default function StudentDashboard() {
  const { user, logout: authLogout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'upload';
  const [studentData, setStudentData] = useState(null);
  const [documents, setDocuments] = useState({});
  const [loading, setLoading] = useState(true);

  const setActiveTab = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  const handleBack = () => {
    if (activeTab !== 'upload') {
      setSearchParams({ tab: 'upload' });
    } else {
      toast('You are on the Document Submission tab', { icon: 'ℹ️' });
    }
  };

  useEffect(() => {
    if (!user?.regNo) {
      navigate('/student/login');
      return;
    }

    const regStr = user.regNo.toString();

    const refreshLocal = () => {
      const localStudents = JSON.parse(localStorage.getItem('ame_local_students') || '[]');
      const cachedStudent = localStudents.find(s => s.regNo?.toString() === regStr);

      setStudentData(
        cachedStudent || {
          id: regStr,
          regNo: regStr,
          name: user.name || 'Student',
          category: user.category || 'OPEN',
          contact1: user.contact1 || '',
          contact2: user.contact2 || '',
          dob: user.dob || '',
          applicationStatus: 'NOT_STARTED',
        }
      );

      const localDocs = JSON.parse(localStorage.getItem(`ame_docs_${regStr}`) || '{}');
      setDocuments(localDocs);
      setLoading(false);
    };

    refreshLocal();

    window.addEventListener('storage', refreshLocal);

    let unsubStudent = () => {};
    let unsubDocs = () => {};

    try {
      unsubStudent = onSnapshot(
        doc(db, 'students', regStr),
        (snap) => {
          if (snap.exists()) {
            setStudentData({ id: snap.id, ...snap.data() });
          }
        },
        (err) => console.warn('Firestore sync note:', err.message)
      );

      unsubDocs = onSnapshot(
        doc(db, 'student_documents', regStr),
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setDocuments(data);
            localStorage.setItem(`ame_docs_${regStr}`, JSON.stringify(data));
          }
        },
        (err) => console.warn('Firestore doc sync note:', err.message)
      );
    } catch (e) {}

    return () => {
      window.removeEventListener('storage', refreshLocal);
      unsubStudent();
      unsubDocs();
    };
  }, [user, navigate]);

  const handleLogout = async () => {
    await logout();
    authLogout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingSpinner text="Opening portal..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col font-sans">
      <div className="sunlight-glow" />
      <Header
        showLogout
        onLogout={handleLogout}
        userInfo={{ name: studentData?.name || user?.name, role: 'student', regNo: user?.regNo }}
        showBack={activeTab !== 'upload'}
        onBack={handleBack}
      />

      {/* Navigation Bar */}
      <div className="glass-header sticky top-0 z-20 border-b border-white/60">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <div className="flex gap-2 py-2.5">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {activeTab !== 'upload' && (
            <button
              onClick={handleBack}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white text-slate-800 text-xs font-bold border border-slate-200 shadow-sm transition-all hover:scale-105"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-blue-600" />
              <span>Back to Uploads</span>
            </button>
          )}
        </div>
      </div>

      <main className="relative z-10 flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {activeTab === 'upload' && (
          <DocumentUpload studentData={studentData} documents={documents} />
        )}
        {activeTab === 'profile' && (
          <StudentProfile studentData={studentData} documents={documents} />
        )}
        {activeTab === 'help' && <HelpInstructions />}
      </main>

      <footer className="glass-header relative z-10 py-4 text-center text-slate-500 text-xs border-t border-white/60">
        ADMISSIONS MADE EASY, LATUR – Student Document Portal 2027 • Helpline: 94226 11661
      </footer>
    </div>
  );
}
