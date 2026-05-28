import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function OtpPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialEmail = location.state?.email || '';

  const [email, setEmail] = useState(initialEmail);
  const [showEmailInput, setShowEmailInput] = useState(!initialEmail);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // References for OTP boxes to auto-focus next input
  const inputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
  ];

  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Handle key inputs inside the OTP grids
  const handleChange = (index, value) => {
    if (isNaN(value)) return; // Allow numbers only
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1); // Get last char
    setOtp(newOtp);

    // Auto-focus next input if we typed a number
    if (value && index < 5) {
      inputRefs[index + 1].current.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Focus previous input on backspace if current is empty
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1].current.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (pasteData.length === 6 && /^\d+$/.test(pasteData)) {
      const pasteArray = pasteData.split('');
      setOtp(pasteArray);
      inputRefs[5].current.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit OTP code');
      return;
    }

    if (!email) {
      setError('Email address is required');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/api/auth/verify-otp', { email, otpCode });
      const { user, token } = res.data.data;
      
      setSuccess('Email verified successfully! Redirecting...');
      localStorage.setItem('token', token);
      
      // Auto login by reloading or navigating
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1500);
    } catch (err) {
      setError(err.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await api.post('/api/auth/resend-otp', { email });
      setSuccess('A new 6-digit verification code has been logged! Check the console/terminal.');
      setTimer(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      inputRefs[0].current.focus();
    } catch (err) {
      setError(err.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900/55 backdrop-blur-md rounded-3xl border border-slate-800/80 p-8 shadow-2xl shadow-black/50">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 text-3xl mb-4 animate-pulse-slow">
            ✉️
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white font-sans">Verify your email</h2>
          <p className="text-sm text-slate-400 mt-2">
            We have sent a 6-digit security code for verification
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-sm text-rose-400 flex gap-2">
            <span className="flex-shrink-0">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400 flex gap-2">
            <span className="flex-shrink-0">✅</span>
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-6">
          {showEmailInput ? (
            <div>
              <label className="label-field">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="Enter registered email"
                required
              />
            </div>
          ) : (
            <div className="bg-slate-950/40 border border-slate-800/40 rounded-xl px-4 py-3 flex justify-between items-center">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500">Verifying Email</p>
                <p className="text-sm font-semibold text-slate-300 truncate max-w-[200px]">{email}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowEmailInput(true)}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
              >
                Change
              </button>
            </div>
          )}

          <div>
            <label className="label-field text-center block mb-4">Enter 6-Digit Code</label>
            <div className="flex justify-between gap-2" onPaste={handlePaste}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={inputRefs[idx]}
                  type="text"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-12 h-14 bg-slate-950/60 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 text-center font-bold text-xl text-white rounded-xl focus:outline-none transition-all duration-150"
                  required
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 transition-all duration-300 transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Verify & Activate Account'
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm text-slate-400">
            Didn't receive the code?{' '}
            {canResend ? (
              <button
                onClick={handleResend}
                disabled={loading}
                className="font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Resend Code
              </button>
            ) : (
              <span className="font-semibold text-slate-500">
                Resend in {timer}s
              </span>
            )}
          </p>
          <button
            onClick={() => navigate('/login')}
            className="text-xs font-semibold text-slate-500 hover:text-slate-400 mt-6 transition-colors"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
