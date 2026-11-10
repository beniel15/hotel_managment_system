import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getLocalBookings, getLocalHotels } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  BedDouble, 
  Calendar, 
  User, 
  Mail, 
  Phone, 
  Search, 
  ArrowLeft,
  CheckCircle2,
  Building2,
  Users,
  Loader2,
  Lock
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const OwnerBookingsList = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState('');

  useEffect(() => {
    const fetchOwnerBookings = async () => {
      setLoading(true);
      try {
        const currentUid = currentUser?.uid;
        const currentEmail = currentUser?.email;

        let remoteBookings = [];
        try {
          const res = await axios.get(`${API_BASE_URL}/owner/bookings`, { 
            params: { ownerId: currentUid, ownerEmail: currentEmail }, 
            timeout: 3000 
          });
          if (res.data && Array.isArray(res.data)) remoteBookings = res.data;
        } catch (e) {
          console.warn("Backend owner bookings fetch notice:", e.message);
        }

        const localBookings = getLocalBookings();
        const allBookingsMap = new Map();
        remoteBookings.forEach(b => allBookingsMap.set(b.bookingId || b.id, b));
        localBookings.forEach(b => {
          const bId = b.bookingId || b.id;
          if (!allBookingsMap.has(bId)) {
            allBookingsMap.set(bId, b);
          }
        });
        const mergedBookings = Array.from(allBookingsMap.values());

        // Get owner's registered hotels first
        const allLocalHotels = getLocalHotels();
        const isSaravanaOwner = Boolean(
          currentEmail === 'owner@luxstay.com' || 
          currentEmail === 'saravanabhavan@gmail.com' ||
          currentEmail?.toLowerCase().includes('saravana') ||
          currentUser?.displayName?.toLowerCase().includes('saravana')
        );

        const ownerHotels = allLocalHotels.filter(h => {
          if (!currentUser) return false;
          const isOwnerIdMatch = Boolean(currentUid && h.ownerId === currentUid);
          const isOwnerEmailMatch = Boolean(currentEmail && (h.ownerId === currentEmail || h.ownerEmail === currentEmail));
          const isSaravanaMatch = Boolean(
            isSaravanaOwner && (h.hotelId === 'h-saravana-bhavan' || h.name?.toLowerCase().includes('saravana'))
          );
          return isOwnerIdMatch || isOwnerEmailMatch || isSaravanaMatch;
        });

        const ownerHotelIds = new Set(ownerHotels.map(h => (h.id || h.hotelId || '').toString().toLowerCase()));
        const ownerHotelNames = new Set(ownerHotels.map(h => (h.name || '').toString().toLowerCase().trim()));

        const isolatedBookings = mergedBookings.filter(b => {
          if (!currentUser || !b) return false;

          const bHotelId = (b.hotelId || '').toString().toLowerCase().trim();
          const bHotelName = (b.hotelName || '').toString().toLowerCase().trim();
          const bOwnerId = (b.ownerId || '').toString().toLowerCase().trim();
          const bOwnerEmail = (b.ownerEmail || '').toString().toLowerCase().trim();

          const matchesUid = Boolean(currentUid && (bOwnerId === currentUid.toLowerCase() || bOwnerEmail === currentUid.toLowerCase()));
          const matchesEmail = Boolean(currentEmail && (bOwnerId === currentEmail.toLowerCase() || bOwnerEmail === currentEmail.toLowerCase()));
          const matchesHotelId = Boolean(bHotelId && ownerHotelIds.has(bHotelId));
          const matchesHotelName = Boolean(bHotelName && Array.from(ownerHotelNames).some(name => name && (bHotelName.includes(name) || name.includes(bHotelName))));
          const matchesSaravana = Boolean(isSaravanaOwner && (bHotelId.includes('saravana') || bHotelName.includes('saravana')));
          
          return matchesUid || matchesEmail || matchesHotelId || matchesHotelName || matchesSaravana;
        });

        setBookings(isolatedBookings);
      } catch (err) {
        console.warn("Error fetching owner bookings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOwnerBookings();
  }, [currentUser]);

  const filteredBookings = bookings.filter(b => {
    const term = filterText.toLowerCase().trim();
    const bId = (b.bookingId || b.id || '').toLowerCase();
    return !term || 
      bId.includes(term) ||
      b.guestName?.toLowerCase().includes(term) ||
      b.hotelName?.toLowerCase().includes(term);
  });

  return (
    <div className="min-h-screen bg-[#F6F3F4] text-slate-900 pb-20 font-sans">
      
      <div className="bg-white border-b border-slate-200/80 py-4 px-4 sm:px-6 lg:px-8 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
          <button onClick={() => navigate('/owner/dashboard')} className="flex items-center space-x-1.5 font-semibold text-[#7B1E3A] hover:underline">
            <ArrowLeft size={16} />
            <span>Back to Owner Dashboard</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Your Property Bookings List</h1>
            <p className="text-xs text-slate-500 font-normal">Customer reservations for your registered hotels only</p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Search by Booking ID, Guest, Hotel..."
              className="w-full bg-white border border-slate-200/80 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7B1E3A]/20 focus:border-[#7B1E3A]"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center space-y-2">
            <Loader2 size={32} className="text-[#7B1E3A] animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-semibold">Loading property reservations...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center max-w-md mx-auto space-y-2 shadow-xs">
            <BedDouble size={36} className="text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No Reservations Found</h3>
            <p className="text-xs text-slate-500">When customers book rooms in your listed hotels, their details will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredBookings.map((bk) => {
              const bId = bk.bookingId || bk.id;

              return (
                <div key={bId} className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 text-xs">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 bg-[#7B1E3A]/10 text-[#7B1E3A] rounded-xl flex items-center justify-center font-mono font-bold">
                        BK
                      </div>
                      <div>
                        <div className="text-base font-extrabold text-slate-900 font-mono">{bId}</div>
                        <div className="text-xs text-[#7B1E3A] font-semibold flex items-center gap-1">
                          <Building2 size={12} /> {bk.hotelName} ({bk.locationName})
                        </div>
                      </div>
                    </div>

                    <span className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 self-start sm:self-auto">
                      <CheckCircle2 size={14} className="text-emerald-600" /> Confirmed & Paid
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    
                    <div className="space-y-1 bg-[#f8fafc] p-3.5 rounded-xl border border-slate-200/80">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Customer Info</span>
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <User size={14} className="text-[#7B1E3A]" /> {bk.guestName}
                      </div>
                      <div className="text-slate-600 flex items-center gap-1.5">
                        <Mail size={12} className="text-slate-400" /> {bk.guestEmail}
                      </div>
                      <div className="text-slate-600 flex items-center gap-1.5">
                        <Phone size={12} className="text-slate-400" /> {bk.guestPhone}
                      </div>
                    </div>

                    <div className="space-y-1 bg-[#f8fafc] p-3.5 rounded-xl border border-slate-200/80">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Room & Dates</span>
                      <div className="font-bold text-slate-900 text-sm">{bk.roomType}</div>
                      <div className="text-slate-700 font-medium flex items-center gap-1.5">
                        <Users size={12} /> Occupancy: {bk.occupancy} Guests ({bk.numberOfGuests} Travelling)
                      </div>
                      <div className="text-slate-600 flex items-center gap-1.5">
                        <Calendar size={12} className="text-slate-400" /> {bk.checkInDate} to {bk.checkOutDate} ({bk.numberOfNights} Nights)
                      </div>
                    </div>

                    <div className="space-y-1 bg-[#f8fafc] p-3.5 rounded-xl border border-slate-200/80">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Payment Details</span>
                      <div className="text-lg font-black text-slate-900">₹ {bk.totalAmount?.toLocaleString('en-IN')}</div>
                      <div className="text-slate-700 font-mono text-[11px] truncate">
                        Pay ID: {bk.razorpayPaymentId || 'pay_DEMO'}
                      </div>
                      <div className="text-emerald-700 font-semibold text-[11px]">
                        Method: {bk.paymentMethod || 'Razorpay'}
                      </div>
                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};

export default OwnerBookingsList;
