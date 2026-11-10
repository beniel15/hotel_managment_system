import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F3F4] text-slate-800 font-sans">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-3 border-[#7B1123] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 text-xs font-semibold">Opening portal...</p>
        </div>
      </div>
    );
  }

  // Auto-provision testing session if visiting directly without logging in first
  if (!currentUser) {
    const isMgr = location.pathname.startsWith('/owner') || location.pathname.startsWith('/manager');
    const isRec = location.pathname.startsWith('/receptionist');
    const defaultUser = isMgr
      ? { userId: 'usr-dev-mgr', name: 'General Manager', email: 'manager@hotelsaravana.com', role: 'manager' }
      : isRec
        ? { userId: 'usr-dev-rec', name: 'Front Desk Receptionist', email: 'receptionist@hotelsaravana.com', role: 'receptionist' }
        : { userId: 'usr-dev-cust', name: 'Customer Guest', email: 'customer@gmail.com', role: 'customer' };

    localStorage.setItem('user_session', JSON.stringify(defaultUser));
    localStorage.setItem('user_role', defaultUser.role);
    if (!localStorage.getItem('auth_token')) {
      localStorage.setItem('auth_token', 'dev-test-token');
    }
  }

  // Direct URL Navigation for Testing:
  // When testing, typing the direct URL in the browser (e.g. /owner/dashboard, /receptionist/dashboard)
  // allows instant access without role restriction blocks or cross-role navigation buttons.
  return children;
};

export default ProtectedRoute;
