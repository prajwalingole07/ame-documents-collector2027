import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  User,
} from 'lucide-react';
import { adminLogin } from '../firebase/authService';
import AuthShell from '../components/common/AuthShell';

export default function AdminLogin() {
  const navigate = useNavigate();

  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!adminId.trim()) {
      setError('Please enter your Admin ID.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      await adminLogin(adminId.trim(), password.trim());
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid admin credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      portal="admin"
      icon={ShieldCheck}
      eyebrow="Scrutiny control center"
      title="Admin sign in"
      subtitle="Authorized admission office staff only. All document decisions sync instantly to student devices."
      sideEyebrow="Admission scrutiny panel · 2027"
      sideTitle="A calmer way to"
      sideAccent="verify admissions."
      sideDescription="Review every certificate, leave precise remarks and keep the whole admission season moving — with one live source of truth."
      sidePoints={[
        {
          title: 'Live scrutiny feed',
          text: 'Uploads, approvals and corrections appear on every screen without a refresh.',
        },
        {
          title: 'Role-protected workspace',
          text: 'A single admin gate for the admission office, protected by hashed credentials.',
        },
        {
          title: 'Complete export toolkit',
          text: 'Generate Excel reports and official candidate ZIP archives in a click.',
        },
      ]}
    >
      {error && (
        <div className="mb-4 rounded-2xl border border-rose-300/60 bg-rose-50/80 px-3.5 py-3 text-[11px] font-semibold text-rose-700 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-600 mb-1.5">
            Admin ID
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 pointer-events-none" />
            <input
              type="text"
              required
              autoComplete="username"
              value={adminId}
              onChange={(e) => setAdminId(e.target.value)}
              placeholder="Enter your admin ID"
              className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-600">
              Admin password
            </label>
            <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
              SHA-256 secured
            </span>
          </div>
          <div className="relative">
            <LockKeyhole className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 pointer-events-none" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full pl-10 pr-11 py-3 rounded-2xl text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-white/60 transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Verifying credentials…
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              Sign in to scrutiny panel
            </>
          )}
        </button>
      </form>

      <div className="mt-5 rounded-2xl border border-white/70 bg-white/35 px-3.5 py-3 flex items-start gap-2.5">
        <LockKeyhole className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0 mt-0.5" />
        <p className="text-[10px] leading-relaxed text-slate-500 font-medium">
          This workspace is monitored. Use only your official admission office credentials and
          sign out after every session.
        </p>
      </div>
    </AuthShell>
  );
}
