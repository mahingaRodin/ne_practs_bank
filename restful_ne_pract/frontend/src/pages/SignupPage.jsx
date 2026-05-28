import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SignupPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'parking_attendant',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      // Success! Navigate to OTP verify
      navigate('/verify-otp', { state: { email: form.email } });
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900/55 backdrop-blur-md rounded-3xl border border-slate-800/80 p-8 shadow-2xl shadow-black/50">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 font-bold text-2xl mb-4">
            🅿️
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-sans bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 via-slate-100 to-indigo-100">
            Create Account
          </h1>
          <p className="text-slate-400 text-sm mt-1">Upgrade your parking operation today</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-sm text-rose-400 flex gap-2">
            <span className="flex-shrink-0">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-field" htmlFor="firstName">First Name</label>
              <input 
                id="firstName" 
                name="firstName" 
                className="input-field" 
                placeholder="First Name" 
                value={form.firstName} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div>
              <label className="label-field" htmlFor="lastName">Last Name</label>
              <input 
                id="lastName" 
                name="lastName" 
                className="input-field" 
                placeholder="Last Name" 
                value={form.lastName} 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>

          <div>
            <label className="label-field" htmlFor="email">Email Address</label>
            <input 
              id="email" 
              name="email" 
              type="email" 
              className="input-field" 
              placeholder="you@xwz.rw" 
              value={form.email} 
              onChange={handleChange} 
              required 
            />
          </div>

          <div>
            <label className="label-field" htmlFor="password">Password</label>
            <input 
              id="password" 
              name="password" 
              type="password" 
              className="input-field" 
              placeholder="Min. 8 characters" 
              minLength={8} 
              value={form.password} 
              onChange={handleChange} 
              required 
            />
          </div>

          <div>
            <label className="label-field" htmlFor="role">Security Role</label>
            <select 
              id="role" 
              name="role" 
              className="input-field cursor-pointer bg-slate-900" 
              value={form.role} 
              onChange={handleChange}
            >
              <option value="parking_attendant">Parking Attendant (Driver)</option>
              <option value="admin">System Admin</option>
            </select>
          </div>

          <button type="submit" className="btn-primary mt-2" disabled={loading}>
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
            ) : (
              'Create Account & Get OTP'
            )}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-8">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
