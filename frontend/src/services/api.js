import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 6000, // 6-second timeout to prevent UI freeze/delay
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Bearer token automatically from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle global 401 Unauthorized gracefully
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (window.location.pathname !== '/login' && window.location.pathname !== '/receptionist/login' && window.location.pathname !== '/manager/login') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_session');
      }
    }
    return Promise.reject(error);
  }
);

/* ==========================================================================
   API SERVICE ENDPOINTS
   ========================================================================== */

// 1. HOTEL INFORMATION
export const getHotelProfile = () => api.get('/hotel');
export const updateHotelProfile = (data) => api.put('/hotel', data);

// 2. ROOMS & AVAILABILITY
export const getRoomTypes = () => api.get('/rooms/types');
export const checkRoomAvailability = (checkInDate, checkOutDate, guests = 1, stayPackage = 'standard_overnight', roomsCount = 1, preferredFloor = 'any') => 
  api.get('/rooms/availability', { params: { checkInDate, checkOutDate, guests, stayPackage, roomsCount, preferredFloor } });
export const getPhysicalRooms = () => api.get('/rooms/physical');
export const updateRoomStatus = (roomNumber, status, maintenanceNotes) => 
  api.patch(`/rooms/physical/${roomNumber}/status`, { status, maintenanceNotes });
export const cleanPhysicalRoom = (roomNumber) =>
  api.patch(`/rooms/physical/${roomNumber}/clean`);
export const createRoomType = (data) => api.post('/rooms/types', data);
export const updateRoomType = (typeId, data) => api.put(`/rooms/types/${typeId}`, data);
export const createPhysicalRoom = (data) => api.post('/rooms/physical', data);

// 3. BOOKINGS & RESERVATIONS
export const createOnlineBooking = (bookingPayload) => api.post('/bookings', bookingPayload);
export const getMyBookings = () => api.get('/bookings/my-bookings');
export const getAllBookings = () => api.get('/bookings/all');
export const getBookingById = (bookingId) => api.get(`/bookings/${bookingId}`);
export const cancelBooking = (bookingId, cancellationReason) => 
  api.patch(`/bookings/${bookingId}/cancel`, { cancellationReason });

// 4. FRONT-DESK OPERATIONS (Receptionist & Manager)
export const createWalkInBooking = (payload) => api.post('/bookings/walk-in', payload);
export const assignRoomToBooking = (bookingId, roomNumber, allocationId) =>
  api.patch(`/bookings/${bookingId}/assign-room`, { roomNumber, allocationId });
export const checkInGuest = (bookingId, roomNumber, allocationId) => 
  api.patch(`/bookings/${bookingId}/check-in`, { roomNumber, allocationId });
export const checkOutGuest = (bookingId, additionalCharges, additionalChargesDescription, allocationId) => 
  api.patch(`/bookings/${bookingId}/check-out`, { additionalCharges, additionalChargesDescription, allocationId });

// 5. MANAGER ANALYTICS, STAFF & MAINTENANCE
export const getManagerAnalytics = () => api.get('/manager/analytics');
export const getStaffList = () => api.get('/manager/staff');
export const createStaffAccount = (data) => api.post('/manager/staff', data);
export const toggleStaffStatus = (userId, isActive) => 
  api.patch(`/manager/staff/${userId}/status`, { isActive });
export const getMaintenanceLogs = () => api.get('/manager/maintenance');
export const scheduleMaintenance = (data) => api.post('/manager/maintenance', data);
export const completeMaintenance = (maintenanceId, resolutionNotes) => 
  api.patch(`/manager/maintenance/${maintenanceId}/complete`, { resolutionNotes });

// 6. REVIEWS & RATINGS
export const getReviews = () => api.get('/reviews');
export const submitReview = (data) => api.post('/reviews', data);

// 7. NOTIFICATIONS & INVOICES
export const getNotifications = () => api.get('/notifications');
export const markNotificationRead = (id) => api.patch(`/notifications/${id}/read`);
export const getBookingInvoice = (bookingId) => api.get(`/payments/invoice/${bookingId}`);

export default api;
