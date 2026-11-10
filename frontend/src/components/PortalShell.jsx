import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LotusLogo from './LotusLogo';
import { Bell, ChevronDown, LogOut, BedDouble } from 'lucide-react';

const PortalShell = ({
  brandSubtitle = 'Management Portal',
  headerTitle,
  headerRight,
  navItems = [],
  children
}) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isManagerPath = typeof window !== 'undefined' && (window.location.pathname.startsWith('/owner') || window.location.pathname.startsWith('/manager'));
  const isReceptionistPath = typeof window !== 'undefined' && window.location.pathname.startsWith('/receptionist');

  const role = isManagerPath ? 'manager' : (isReceptionistPath ? 'receptionist' : (currentUser?.role || 'staff'));
  const isManager = role === 'manager' || role === 'owner';
  const displayName = currentUser?.name || currentUser?.displayName || (isManager ? 'General Manager' : 'Front Desk Staff');
  const initialLetter = displayName.trim().charAt(0).toUpperCase() || (isManager ? 'M' : 'R');
  const roleLabel = isManagerPath ? 'General Manager' : (isReceptionistPath ? 'Front Desk Receptionist' : 'Staff');

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    navigate(isManager ? '/owner/login' : '/receptionist/login');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 flex flex-col font-sans">
      {/* 1. Full-Width Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200/90 h-16 px-5 sm:px-8 flex items-center justify-between sticky top-0 z-40">
        <LotusLogo subtitle={brandSubtitle} to={isManager ? '/owner/dashboard' : '/receptionist/dashboard'} />

        <div className="flex items-center gap-4">
          {/* Notification Bell with Red Badge */}
          <button
            type="button"
            className="relative p-2 text-slate-600 hover:text-[#7B1123] hover:bg-rose-50/60 rounded-full transition-colors"
            title="Notifications"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#E11D48] rounded-full ring-2 ring-white"></span>
          </button>

          {/* Profile Dropdown with Dynamic Initial Avatar */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-full hover:bg-slate-50 transition-colors"
            >
              {/* Dynamic Letter Avatar */}
              <div className="w-8 h-8 rounded-full bg-[#7B1123] text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                {initialLetter}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-slate-800 leading-tight flex items-center gap-1">
                  <span>{displayName}</span>
                  <ChevronDown size={12} className="text-slate-400" />
                </div>
                <div className="text-[10px] text-slate-500 font-medium leading-none">{roleLabel}</div>
              </div>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 text-xs">
                <div className="px-4 py-2 border-b border-slate-100 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#7B1123] text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
                    {initialLetter}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 truncate">{displayName}</div>
                    <div className="text-[11px] text-slate-500 truncate">{currentUser?.email}</div>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-2 text-rose-600 hover:bg-rose-50 font-bold"
                  >
                    <LogOut size={14} className="mr-2" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. Main Portal Body with Left Maroon Sidebar & Right Content */}
      <div className="flex-1 flex min-h-[calc(100vh-64px)]">
        {/* Left Dark Maroon Sidebar */}
        <aside className="w-[230px] shrink-0 bg-[#580E1B] text-white flex flex-col py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.active;

            return (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold transition-all ${
                  active
                    ? 'bg-[#7B1123] text-white shadow-xs'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                {Icon ? <Icon size={16} className={active ? 'text-white' : 'text-white/70'} /> : null}
                <span>{item.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Right Main Content */}
        <main className="flex-1 min-w-0 p-5 sm:p-7 space-y-6 overflow-x-hidden">
          {/* Subheader Title & Header Right */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{headerTitle}</h1>
            {headerRight ? <div>{headerRight}</div> : null}
          </div>

          {children}
        </main>
      </div>
    </div>
  );
};

export default PortalShell;
