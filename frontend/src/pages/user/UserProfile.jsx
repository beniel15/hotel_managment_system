import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import GuestAccountLayout from '../../components/GuestAccountLayout';
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  LogOut, 
  ArrowLeft, 
  Building2, 
  CheckCircle2, 
  Key, 
  Save, 
  AlertCircle 
} from 'lucide-react';

const UserProfile = () => {
  const navigate = useNavigate();
  const { currentUser, updateProfile, changePassword, logout } = useAuth();

  const [name, setName] = useState(currentUser?.name || currentUser?.displayName || '');
  const [phone, setPhone] = useState(currentUser?.phone || '+91 98765 43210');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  // Password Change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPass, setChangingPass] = useState(false);
  const [passMsg, setPassMsg] = useState('');
  const [passError, setPassError] = useState('');

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    setProfileMsg('');
    try {
      await updateProfile({ name, phone });
      setProfileMsg('Profile updated successfully!');
      setTimeout(() => setProfileMsg(''), 2000);
    } catch (err) {
      alert('Could not update profile.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangingPass(true);
    setPassMsg('');
    setPassError('');
    try {
      await changePassword(currentPassword, newPassword);
      setPassMsg('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setPassMsg(''), 2500);
    } catch (err) {
      setPassError(err.response?.data?.message || err.message || 'Failed to update password.');
    } finally {
      setChangingPass(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#F6F3F4] text-slate-900 pb-16 font-sans">
      <GuestAccountLayout>
      <div className="space-y-6">
        
        {/* Profile Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs text-center space-y-3">
          <img 
            src={currentUser?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.email}`} 
            alt="Avatar" 
            className="w-20 h-20 rounded-2xl mx-auto border-2 border-[#7B1E3A] p-0.5 object-cover shadow-xs"
          />
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">{currentUser?.name || 'User Profile'}</h1>
            <p className="text-xs text-slate-500">{currentUser?.email}</p>
          </div>

          <div className="inline-flex items-center gap-1.5 bg-[#7B1E3A]/10 text-[#7B1E3A] border border-[#7B1E3A]/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <Shield size={14} />
            <span>Role: {currentUser?.role || 'Customer'}</span>
          </div>
        </div>

        {/* Edit Personal Details */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            Personal Information
          </h3>

          {profileMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2.5 rounded-xl text-xs font-bold text-center">
              {profileMsg}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Full Name</label>
              <input 
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2.5 font-semibold text-slate-900 focus:outline-none focus:border-[#7B1E3A]"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
              <input 
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2.5 font-semibold text-slate-900 focus:outline-none focus:border-[#7B1E3A]"
                required
              />
            </div>

            <div className="pt-1 flex justify-end">
              <button
                type="submit"
                disabled={updatingProfile}
                className="px-4 py-2 bg-[#7B1E3A] hover:bg-[#5C152C] text-white font-bold rounded-xl shadow-xs transition-colors"
              >
                {updatingProfile ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
            <Key size={14} className="text-[#7B1E3A]" />
            <span>Security & Password</span>
          </h3>

          {passMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2.5 rounded-xl text-xs font-bold text-center">
              {passMsg}
            </div>
          )}
          {passError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-2.5 rounded-xl text-xs font-semibold text-center">
              {passError}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Current Password</label>
              <input 
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2.5 font-mono text-slate-900 focus:outline-none focus:border-[#7B1E3A]"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">New Password (Min 6 characters)</label>
              <input 
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2.5 font-mono text-slate-900 focus:outline-none focus:border-[#7B1E3A]"
                required
              />
            </div>

            <div className="pt-1 flex justify-end">
              <button
                type="submit"
                disabled={changingPass}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs transition-colors"
              >
                {changingPass ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>

        {/* Sign Out Button */}
        <div className="pt-2">
          <button
            onClick={handleLogout}
            className="w-full py-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-xs"
          >
            <LogOut size={16} />
            <span>Sign Out of Account</span>
          </button>
        </div>

      </div>
      </GuestAccountLayout>
    </div>
  );
};

export default UserProfile;
