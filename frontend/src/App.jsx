import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Customer Pages
import UserLogin from './pages/user/UserLogin';
import SingleHotelHome from './pages/user/SingleHotelHome';
import RoomBooking from './pages/user/RoomBooking';
import Payment from './pages/user/Payment';
import BookingConfirmation from './pages/user/BookingConfirmation';
import MyBookings from './pages/user/MyBookings';
import BookingDetailsView from './pages/user/BookingDetailsView';

// Manager / Owner Pages
import OwnerLogin from './pages/owner/OwnerLogin';
import OwnerDashboard from './pages/owner/OwnerDashboard';

// Receptionist Pages
import ReceptionistLogin from './pages/receptionist/ReceptionistLogin';
import ReceptionistDashboard from './pages/receptionist/ReceptionistDashboard';

function AppContent() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 flex flex-col justify-between font-sans">
      <div>
        <Navbar />
        
        <Routes>
          {/* Customer / Guest Routes */}
          <Route path="/login" element={<UserLogin />} />
          <Route path="/" element={<SingleHotelHome />} />
          <Route path="/hotel/:id" element={<SingleHotelHome />} />
          <Route path="/hotel" element={<SingleHotelHome />} />

          <Route 
            path="/book" 
            element={
              <ProtectedRoute allowedRoles={['customer', 'user', 'manager', 'receptionist']}>
                <RoomBooking />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/book/:typeId" 
            element={
              <ProtectedRoute allowedRoles={['customer', 'user', 'manager', 'receptionist']}>
                <RoomBooking />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/book/:hotelId/:roomId" 
            element={
              <ProtectedRoute allowedRoles={['customer', 'user', 'manager', 'receptionist']}>
                <RoomBooking />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/payment" 
            element={
              <ProtectedRoute allowedRoles={['customer', 'user', 'manager', 'receptionist']}>
                <Payment />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/booking-confirmation" 
            element={
              <ProtectedRoute allowedRoles={['customer', 'user', 'manager', 'receptionist']}>
                <BookingConfirmation />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/my-bookings" 
            element={
              <ProtectedRoute allowedRoles={['customer', 'user', 'manager', 'receptionist']}>
                <MyBookings />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/bookings" 
            element={
              <ProtectedRoute allowedRoles={['customer', 'user', 'manager', 'receptionist']}>
                <MyBookings />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/bookings/:bookingId" 
            element={
              <ProtectedRoute allowedRoles={['customer', 'user', 'manager', 'receptionist']}>
                <BookingDetailsView />
              </ProtectedRoute>
            } 
          />
          {/* Redirect removed redundant profile page to My Bookings */}
          <Route path="/profile" element={<Navigate to="/my-bookings" replace />} />

          {/* Manager / Owner Portal Routes */}
          <Route path="/owner/login" element={<OwnerLogin />} />
          <Route path="/manager/login" element={<OwnerLogin />} />
          <Route 
            path="/owner/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['manager', 'owner']}>
                <OwnerDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/manager/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['manager', 'owner']}>
                <OwnerDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/owner/bookings" 
            element={
              <ProtectedRoute allowedRoles={['manager', 'owner']}>
                <OwnerDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Receptionist Front Desk Routes */}
          <Route path="/receptionist/login" element={<ReceptionistLogin />} />
          <Route 
            path="/receptionist/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['receptionist', 'manager', 'owner']}>
                <ReceptionistDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}
