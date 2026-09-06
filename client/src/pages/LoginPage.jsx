import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const { user } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [role, setRole] = useState('VIEWER');
  const [error, setError] = useState('');

  useEffect(() => {
    const loginError = new URLSearchParams(window.location.search).get('error');
    if (loginError === 'admin_not_allowed') {
      setError('This Google account is not one of the two authorized admin accounts. Choose User or sign in with an authorized admin account.');
      window.history.replaceState({}, document.title, '/login');
    }

    if (loginError === 'google_auth_failed') {
      setError('Google sign-in could not be completed. Please try again. If it continues, check the backend deployment logs.');
      window.history.replaceState({}, document.title, '/login');
    }

  }, []);

  const handleGoogleLogin = () => {
    setIsRedirecting(true);
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/google?role=${role}`;
  };

  return (
    <div
      className="relative flex min-h-screen items-center justify-center bg-slate-950 bg-cover bg-center px-6 py-10"
      style={{ backgroundImage: "url('/ChatGPT%20Image%20Sep%206,%202026,%2008_03_15%20PM.png')" }}
    >
      <div className="absolute inset-0 bg-slate-950/45" />
      <div className="relative w-full max-w-md rounded-2xl border border-white/20 bg-slate-950/85 p-8 shadow-2xl backdrop-blur-sm">
        <p className="text-sm uppercase tracking-[0.2em] text-cyan-400">VTech Technologies</p>
        <h1 className="mt-4 text-3xl font-semibold text-white">Level Up Your Tech Skills</h1>
        <p className="mt-3 text-slate-300">Turn Knowledge Into Skills.</p>
        {user && <p className="mt-4 rounded-lg border border-cyan-400/30 bg-cyan-950/30 p-3 text-sm text-cyan-100">Choose a role and verify with Google again to start a new session.</p>}
        {error && <p className="mt-4 rounded-lg border border-red-400/40 bg-red-950/50 p-3 text-sm text-red-200">{error}</p>}
        <label className="mt-6 block text-sm font-medium text-slate-200" htmlFor="role">Sign in as</label>
        <select
          id="role"
          value={role}
          onChange={(event) => setRole(event.target.value)}
          className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-slate-100"
          disabled={isRedirecting}
        >
          <option value="VIEWER">User</option>
          <option value="ADMIN">Admin</option>
        </select>
        <p className="mt-2 text-xs text-slate-400">*Required Choosing roles</p>
        <button
          onClick={handleGoogleLogin}
          disabled={isRedirecting}
          className="mt-8 flex w-full items-center justify-center rounded-lg bg-white px-4 py-3 font-medium text-slate-900 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isRedirecting ? 'Redirecting to Google...' : 'Continue with Google'}
        </button>
      </div>
    </div>
  );
}
