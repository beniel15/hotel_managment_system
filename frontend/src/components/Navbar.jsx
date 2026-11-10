import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LotusLogo from './LotusLogo';
import {
  LogOut,
  ChevronDown,
  BedDouble,
  Bell
} from 'lucide-react';

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Portal pages have their own full-width header integrated in PortalShell
  const hideNavbarOnPages = [
    '/login',
    '/owner/login',
    '/manager/login',
    '/receptionist/login',
    '/owner/dashboard',
    '/manager/dashboard',
    '/owner/bookings',
    '/receptionist/dashboard'
  ];
  if (hideNavbarOnPages.includes(location.pathname)) {
    return null;
  }

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    navigate('/login');
  };

  const rawName = currentUser?.name || currentUser?.displayName || currentUser?.email || 'Guest';
  const initialLetter = rawName.trim().charAt(0).toUpperCase() || 'G';
  const shortName = rawName.split(' ')[0];

  const navPill = (to, label) => {
    const isHome = to === '/' && location.pathname === '/';
    return (
      <Link
        to={to}
        className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
          isHome
            ? 'bg-[#7B1123] text-white shadow-xs'
            : 'text-slate-700 hover:text-[#7B1123]'
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <nav className="bg-white border-b border-slate-200/90 sticky top-0 z-50 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo with Lotus Flower */}
          <LotusLogo subtitle="Premium Stay Experience" to="/" />

          {/* Customer Navigation Links Only */}
          <div className="hidden md:flex items-center space-x-1">
            {navPill('/', 'Home')}
            <a href="/#rooms" className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-[#7B1123] transition-colors">
              Rooms
            </a>
            <a href="/#facilities" className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-[#7B1123] transition-colors">
              Facilities
            </a>
            <a href="/#offers" className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-[#7B1123] transition-colors">
              Offers
            </a>
            <a href="/#reviews" className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-[#7B1123] transition-colors">
              Reviews
            </a>
            <a href="/#contact" className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-[#7B1123] transition-colors">
              Contact
            </a>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center space-x-3">
            {/* Notification Bell with Red Badge */}
            <button
              type="button"
              onClick={() => navigate('/my-bookings')}
              className="relative p-2 text-slate-600 hover:text-[#7B1123] hover:bg-rose-50/60 rounded-full transition-colors"
              title="Notifications"
            >
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#E11D48] rounded-full ring-2 ring-white"></span>
            </button>

            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2 pl-1 pr-2 py-1 rounded-full hover:bg-slate-50 transition-colors"
                >
                  {/* Dynamic Letter Avatar */}
                  <div className="w-8 h-8 rounded-full bg-[#7B1123] text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                    {initialLetter}
                  </div>
                  <span className="text-xs font-semibold text-slate-800 hidden sm:inline-block">
                    Hi, {shortName}
                  </span>
                  <ChevronDown size={14} className="text-slate-400" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 text-xs">
                    <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-[#7B1123] text-white flex items-center justify-center font-bold text-sm uppercase shrink-0">
                        {initialLetter}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate">{rawName}</div>
                        <div className="text-[11px] text-slate-500 truncate">{currentUser.email}</div>
                      </div>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/my-bookings"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-slate-700 hover:bg-rose-50/60 hover:text-[#7B1123] font-medium"
                      >
                        <BedDouble size={14} className="mr-2.5 text-[#7B1123]" />
                        <span>My Bookings</span>
                      </Link>
                    </div>

                    <div className="pt-1 border-t border-slate-100">
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
            ) : (
              <Link
                to="/login"
                className="px-4 py-1.5 bg-[#7B1123] hover:bg-[#600D1B] text-white font-semibold rounded-full text-xs shadow-xs transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
