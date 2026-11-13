import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Eye,
  EyeOff,
  GraduationCap,
  Hash,
  Loader2,
  LockKeyhole,
  Phone,
} from 'lucide-react';
import { studentLogin } from '../firebase/authService';
import { useAuth } from '../context/AuthContext';
import AuthShell from '../components/common/AuthShell';

export default function StudentLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgot, setShowForgot] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!loginId.trim()) {
      setError('Please enter your Registration Number or Receipt Number.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const session = await studentLogin(loginId.trim(), password.trim());
      login(session);
      navigate('/student/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      portal="student"
      icon={GraduationCap}
      eyebrow="Secure sign in"
      title="Welcome back"
      subtitle="Sign in to upload your admission documents and follow the scrutiny status live."
      sideEyebrow="Student document portal · 2027"
      sideTitle="Your documents,"
      sideAccent="finally in sync."
      sideDescription="No queues, no lost files. Complete your admission checklist from any phone or computer and see every verification decision as it happens."
      sidePoints={[
        {
          title: 'Upload from any device',
          text: 'Photos and PDFs are securely stored in the cloud, ready for the scrutiny desk.',
        },
        {
          title: 'Know what is missing',
          text: 'A category-aware checklist shows exactly which certificates are still required.',
        },
        {
          title: 'Live verification updates',
          text: 'Correct, incorrect or re-upload — the office remarks appear on your screen instantly.',
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
            Registration / receipt number
          </label>
          <div className="relative">
            <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 pointer-events-none" />
            <input
              type="text"
              required
              autoComplete="username"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="e.g. 20270001"
              className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-600">
              Password
            </label>
            <button
              type="button"
              onClick={() => setShowForgot(!showForgot)}
              className="text-[10px] font-extrabold text-indigo-600 hover:text-indigo-800 hover:underline"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <LockKeyhole className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 pointer-events-none" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mobile number or DOB"
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
          <p className="mt-1.5 text-[10px] text-slate-400 font-medium">
            Use your mobile number, parent’s mobile number or date of birth (DDMMYYYY).
          </p>
        </div>

        {showForgot && (
          <div className="rounded-2xl border border-amber-300/60 bg-amber-50/75 px-3.5 py-3 text-[11px] text-amber-900">
            <p className="font-extrabold flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" /> Need help signing in?
            </p>
            <p className="mt-1 leading-relaxed">
              Call the admission office on{' '}
              <a href="tel:9422611661" className="font-extrabold underline text-indigo-700">
                94226 11661
              </a>{' '}
              to retrieve or reset your password.
            </p>
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Opening your dashboard…
            </>
          ) : (
            <>
              <GraduationCap className="w-4 h-4" />
              Access student dashboard
            </>
          )}
        </button>
      </form>

      <div className="mt-5 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-500">
        <span className="status-dot bg-emerald-500 live-dot" />
        Live cloud sync enabled · Your data is shared only with the admission office
      </div>
    </AuthShell>
  );
}
