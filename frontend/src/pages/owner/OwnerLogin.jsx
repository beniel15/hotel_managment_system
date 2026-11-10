import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Building2, Mail, Lock, UserCheck, ArrowRight, AlertCircle, Sparkles, ShieldCheck } from 'lucide-react';

const OwnerLogin = () => {
  const navigate = useNavigate();
  const { loginWithEmail, quickDemoLogin } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await loginWithEmail(email, password, 'manager');
      navigate('/owner/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Invalid manager credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoFill = async () => {
    setEmail('manager@hotelsaravana.com');
    setPassword('Manager@123');
    setIsSubmitting(true);
    try {
      await quickDemoLogin('manager');
      navigate('/owner/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
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
            <ShieldCheck size={16} />
            <span>General Manager / Owner Portal</span>
          </h2>
          <p className="text-xs text-slate-500">Access business analytics, room inventory, rates and staff controls.</p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Manager Email Address</label>
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
            disabled={isSubmitting}
            className="w-full py-3 bg-[#7B1E3A] hover:bg-[#5C152C] text-white font-bold rounded-xl text-xs shadow-xs transition-all disabled:opacity-70"
          >
            {isSubmitting ? 'Authenticating Manager...' : 'Sign In to Manager Portal'}
          </button>
        </form>

        {/* 1-Click Demo Login */}
        <div className="pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleDemoFill}
            className="w-full py-2 bg-[#f8fafc] hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Sparkles size={13} className="text-[#7B1E3A]" />
            <span>1-Click Manager Demo Login</span>
          </button>
        </div>

        <div className="text-center text-xs text-slate-400 pt-1">
          <Link to="/" className="text-[#7B1E3A] font-bold hover:underline">
            Return to Hotel Home
          </Link>
        </div>

      </div>
    </div>
  );
};

export default OwnerLogin;
