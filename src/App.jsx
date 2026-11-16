import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { getCurrentSession } from './utils/session';

// ---- Lazy-loaded pages ---------------------------------------------------
// Each route is its own chunk so the public landing page never downloads the
// dashboards, Firebase SDK, charts, Excel or ZIP libraries.
const LandingPage = lazy(() => import('./pages/LandingPage'));
const StudentLogin = lazy(() => import('./pages/StudentLogin'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

function PageLoader() {
  return (
    <div className="relative z-10 min-h-[100dvh] flex flex-col items-center justify-center gap-4 px-6">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-500 text-white flex items-center justify-center shadow-xl shadow-indigo-500/30">
        <span className="w-5 h-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
      </div>
      <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-indigo-700">
        Loading portal…
      </p>
    </div>
  );
}

// ---- ProtectedRoute component -------------------------------------------

/**
 * Wraps a route and redirects to the appropriate login page if the session
 * is missing or the role does not match.
 *
 * @param {{ children: React.ReactNode, requiredRole: 'student'|'admin' }} props
 */
function ProtectedRoute({ children, requiredRole }) {
  const session = getCurrentSession();

  if (!session) {
    const redirectTo = requiredRole === 'admin' ? '/admin/login' : '/student/login';
    return <Navigate to={redirectTo} replace />;
  }

  if (session.role !== requiredRole) {
    // Wrong role: redirect to their own dashboard
    const redirectTo = session.role === 'admin' ? '/admin/dashboard' : '/student/dashboard';
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}

// ---- App root -----------------------------------------------------------

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Living aurora backdrop shared by every screen */}
        <div className="aurora-stage" aria-hidden="true">
          <span className="orb orb-indigo" />
          <span className="orb orb-cyan" />
          <span className="orb orb-pink" />
          <span className="orb orb-mint" />
          <span className="aurora-grid" />
        </div>

        {/* Global toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgba(20, 26, 58, 0.9)',
              color: '#f8fafc',
              border: '1px solid rgba(255,255,255,0.16)',
              borderRadius: '16px',
              boxShadow: '0 24px 50px -18px rgba(20, 26, 58, 0.7)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              fontSize: '13px',
              fontWeight: 600,
              padding: '12px 16px',
            },
            success: {
              iconTheme: { primary: '#34d399', secondary: '#052e2b' },
            },
            error: {
              iconTheme: { primary: '#fb7185', secondary: '#3f0713' },
            },
          }}
        />

        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/student/login" element={<StudentLogin />} />
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Protected: Student */}
            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute requiredRole="student">
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />

            {/* Protected: Admin */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Catch-all: redirect to landing */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
