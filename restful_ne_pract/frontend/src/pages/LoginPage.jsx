import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [unverified, setUnverified] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setUnverified(false);
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Authentication failed');
      if (err.message && (err.message.includes('not verified') || err.message.includes('verify'))) {
        setUnverified(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900/55 backdrop-blur-md rounded-3xl border border-slate-800/80 p-8 shadow-2xl shadow-black/50">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 font-bold text-2xl mb-4">
            🅿️
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-sans bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 via-slate-100 to-indigo-100">
            Welcome Back
          </h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to control your parking grid</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-sm text-rose-400">
            <div className="flex gap-2">
              <span className="flex-shrink-0">⚠️</span>
              <span>{error}</span>
            </div>
            {unverified && (
              <button
                type="button"
                onClick={() => navigate('/verify-otp', { state: { email: form.email } })}
                className="mt-3 w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <span>Verify Email with OTP Now</span> →
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-field" htmlFor="email">Email Address</label>
            <input 
              id="email" 
              type="email" 
              className="input-field" 
              placeholder="you@xwz.rw" 
              value={form.email} 
              onChange={(e) => setForm({ ...form, email: e.target.value })} 
              required 
            />
          </div>

          <div>
            <label className="label-field" htmlFor="password">Password</label>
            <input 
              id="password" 
              type="password" 
              className="input-field" 
              placeholder="••••••••" 
              value={form.password} 
              onChange={(e) => setForm({ ...form, password: e.target.value })} 
              required 
            />
          </div>

          <button type="submit" className="btn-primary mt-2" disabled={loading}>
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
            ) : (
              'Log In'
            )}
          </button>
        </form>

        <div className="mt-8 p-4 bg-slate-950/40 border border-slate-800/40 rounded-2xl text-[11px] text-slate-400 space-y-2">
          <p className="font-bold text-slate-300 uppercase tracking-wider">🔒 Operational Demo Accounts:</p>
          <div className="flex justify-between border-b border-slate-800/40 pb-1.5">
            <span>Admin Role:</span>
            <span className="font-semibold text-slate-200">admin@xwz.rw / Admin@123</span>
          </div>
          <div className="flex justify-between">
            <span>Attendant:</span>
            <span className="font-semibold text-slate-200">attendant@xwz.rw / Attendant@123</span>
          </div>
        </div>

        <p className="text-center text-sm text-slate-400 mt-8">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
