import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { getCurrentSession } from './firebase/authService';

// ---- Lazy-loaded page components ----------------------------------------
// These are placeholder imports that the UI layer (built by other agents) will
// provide. We define the shell routing here so the app boots with the correct
// structure even before all UI pages are ready.

import LandingPage     from './pages/LandingPage';
import StudentLogin    from './pages/StudentLogin';
import AdminLogin      from './pages/AdminLogin';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard  from './pages/AdminDashboard';

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

        <Routes>
          {/* Public routes */}
          <Route path="/"               element={<LandingPage />} />
          <Route path="/student/login"  element={<StudentLogin />} />
          <Route path="/admin/login"    element={<AdminLogin />} />

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
      </BrowserRouter>
    </AuthProvider>
  );
}
