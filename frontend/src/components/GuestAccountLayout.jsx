import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Calendar, Star, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const GuestAccountLayout = ({ children }) => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const displayName = currentUser?.name || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Guest';
  const displayEmail = currentUser?.email || '';
  const initialLetter = displayName.trim().charAt(0).toUpperCase() || 'G';

  const menuItems = [
    { to: '/my-bookings', label: 'My Bookings', icon: Calendar },
    { to: '/my-bookings?tab=COMPLETED', label: 'Reviews & Ratings', icon: Star },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 items-start">
        {/* Left Profile Sidebar */}
        <aside className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
          {/* User Initial Avatar & Info */}
          <div className="text-center pb-5 border-b border-slate-100">
            <div className="w-20 h-20 rounded-full mx-auto bg-[#7B1123] text-white flex items-center justify-center font-black text-2xl uppercase shadow-sm">
              {initialLetter}
            </div>
            <h2 className="mt-3 text-base font-bold text-slate-900 leading-tight">
              {displayName}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 truncate">{displayEmail}</p>
          </div>

          {/* Menu Items */}
          <nav className="mt-4 space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = item.to === '/my-bookings' && location.pathname === '/my-bookings' && !location.search;

              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? 'bg-[#7B1123] text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-[#7B1123]'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon size={16} className={active ? 'text-white' : 'text-slate-500'} />
                    {item.label}
                  </span>
                </Link>
              );
            })}

            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut size={16} />
              Logout
            </button>
          </nav>
        </aside>

        {/* Right Content Area */}
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
};

export default GuestAccountLayout;
