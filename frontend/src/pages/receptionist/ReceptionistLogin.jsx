import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Building2, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, Clock, ShieldCheck, Sparkles } from 'lucide-react';

const ReceptionistLogin = () => {
  const navigate = useNavigate();
  const { loginWithEmail, quickDemoLogin } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await loginWithEmail(email, password, 'receptionist');
      navigate('/receptionist/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Check your staff credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoFill = async () => {
    setEmail('receptionist@hotelsaravana.com');
    setPassword('Reception@123');
    setSubmitting(true);
    try {
      await quickDemoLogin('receptionist');
      navigate('/receptionist/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F3F4] text-slate-900 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-2xl p-8 shadow-xs space-y-5">
        
        <div className="text-center space-y-1">
          <div className="inline-flex items-center space-x-2 mb-1">
            <div className="w-9 h-9 bg-[#7B1E3A] text-white rounded-full flex items-center justify-center font-black text-lg shadow-sm">
              S
            </div>
            <span className="text-lg font-black text-slate-900 tracking-tight">Hotel Saravana</span>
          </div>
          <h2 className="text-base font-bold text-[#7B1E3A] flex items-center justify-center gap-1.5">
            <Clock size={16} />
            <span>Front Desk Staff Sign In</span>
          </h2>
          <p className="text-xs text-slate-500">Day-to-day front desk operations, arrivals, walk-ins & check-in management.</p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Staff Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#7B1E3A]"
              required 
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#7B1E3A]"
              required 
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition-all disabled:opacity-70"
          >
            {submitting ? 'Authenticating Staff...' : 'Sign In to Front Desk'}
          </button>
        </form>

        </div>
    </div>
  );
};

export default ReceptionistLogin;
