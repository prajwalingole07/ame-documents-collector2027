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
        {/* Global toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#1f2937',
              borderRadius: '10px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#16a34a', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#dc2626', secondary: '#fff' },
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
