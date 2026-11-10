import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signOut,
  isFirebaseConfigured 
} from '../config/firebase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('user_session');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('auth_token') || null);
  const [loading, setLoading] = useState(true);

  // Helper to persist session
  const saveSession = (jwtToken, userData) => {
    setToken(jwtToken);
    setCurrentUser(userData);
    localStorage.setItem('auth_token', jwtToken);
    localStorage.setItem('user_session', JSON.stringify(userData));
    localStorage.setItem('user_role', userData.role);
  };

  // Restore session from Backend on mount
  useEffect(() => {
    const verifyStoredToken = async () => {
      const storedToken = localStorage.getItem('auth_token');
      if (storedToken) {
        try {
          const res = await axios.get(`${API_BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${storedToken}` },
            timeout: 3000
          });
          if (res.data && res.data.user) {
            setCurrentUser(res.data.user);
            localStorage.setItem('user_session', JSON.stringify(res.data.user));
            localStorage.setItem('user_role', res.data.user.role);
          }
        } catch (err) {
          console.warn('Session verification notice (using cached session):', err.message);
          // If token explicitly expired (401), clear
          if (err.response && err.response.status === 401) {
            logout();
          }
        }
      }
      setLoading(false);
    };

    verifyStoredToken();
  }, []);

  // 1. Email & Password Login
  const loginWithEmail = async (email, password, expectedRole = null) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password,
        expectedRole
      });

      if (res.data && res.data.token && res.data.user) {
        saveSession(res.data.token, res.data.user);
        return res.data.user;
      }
      throw new Error('Invalid response from server.');
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Login failed';
      throw new Error(msg);
    }
  };

  // 2. Email & Password Registration (Customer)
  const registerWithEmail = async (email, password, name, phone) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/register`, {
        name,
        email,
        password,
        phone
      });

      if (res.data && res.data.token && res.data.user) {
        saveSession(res.data.token, res.data.user);
        return res.data.user;
      }
      throw new Error('Registration failed');
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Registration failed';
      throw new Error(msg);
    }
  };

  // 3. Google Sign-In with OAuth
  const loginWithGoogle = async (role = 'customer') => {
    try {
      let email = '';
      let displayName = '';
      let photoURL = '';

      if (isFirebaseConfigured && auth && googleProvider) {
        const result = await signInWithPopup(auth, googleProvider);
        const fbUser = result.user;
        email = fbUser.email;
        displayName = fbUser.displayName;
        photoURL = fbUser.photoURL;
      } else {
        email = prompt("Enter your Google Account email to test Google Sign-In:", "guest.user@gmail.com");
        if (!email) throw new Error("Google Sign-In cancelled");
        displayName = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        photoURL = `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`;
      }

      // Send to Backend to exchange for signed application JWT
      const res = await axios.post(`${API_BASE_URL}/auth/verify-google-token`, {
        email,
        displayName,
        photoURL,
        role: role === 'owner' ? 'manager' : role
      });

      if (res.data && res.data.token && res.data.user) {
        saveSession(res.data.token, res.data.user);
        return res.data.user;
      }
      throw new Error('Token verification failed');
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Google authentication failed';
      throw new Error(msg);
    }
  };

  // 4. Quick Demo Login (for placement demonstrations)
  const quickDemoLogin = async (roleName) => {
    let email = 'customer@gmail.com';
    let pass = 'Customer@123';
    let role = 'customer';

    if (roleName === 'manager' || roleName === 'owner') {
      email = 'manager@hotelsaravana.com';
      pass = 'Manager@123';
      role = 'manager';
    } else if (roleName === 'receptionist') {
      email = 'receptionist@hotelsaravana.com';
      pass = 'Reception@123';
      role = 'receptionist';
    }

    return loginWithEmail(email, pass, role);
  };

  // 5. Update Profile
  const updateProfile = async (profileData) => {
    const res = await axios.put(`${API_BASE_URL}/auth/profile`, profileData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.data && res.data.user) {
      setCurrentUser(res.data.user);
      localStorage.setItem('user_session', JSON.stringify(res.data.user));
      return res.data.user;
    }
  };

  // 6. Change Password
  const changePassword = async (currentPassword, newPassword) => {
    const res = await axios.put(`${API_BASE_URL}/auth/change-password`, {
      currentPassword,
      newPassword
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  };

  // 7. Logout
  const logout = async () => {
    if (isFirebaseConfigured && auth) {
      try {
        await signOut(auth);
      } catch (e) {}
    }
    setToken(null);
    setCurrentUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_session');
    localStorage.removeItem('user_role');
  };

  const value = {
    currentUser,
    token,
    loading,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    quickDemoLogin,
    updateProfile,
    changePassword,
    logout,
    logoutUser: logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
