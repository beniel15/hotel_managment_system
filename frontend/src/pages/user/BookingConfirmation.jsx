import React, { useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  MapPin, 
  Printer, 
  Home, 
  BedDouble,
  ShieldCheck,
  Calendar,
  User,
  Clock,
  ChevronRight
} from 'lucide-react';

const BookingConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const booking = location.state?.booking;

  useEffect(() => {
    if (booking) {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [booking]);

  if (!booking) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] text-slate-800 flex items-center justify-center p-6 font-sans">
        <div className="text-center space-y-3 max-w-md bg-white border border-slate-200 p-8 rounded-2xl shadow-2xs">
          <h2 className="text-lg font-bold text-slate-900">No Booking Record Found</h2>
          <button 
            onClick={() => navigate('/')} 
            className="px-4 py-2 bg-[#7B1123] hover:bg-[#600D1B] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Return to Hotel Home
          </button>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 pb-20 font-sans">
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-6">
        
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200 shadow-2xs">
            <CheckCircle2 size={32} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Booking Confirmed!</h1>
          <p className="text-xs text-slate-500">
            Your reservation is officially registered at Hotel Saravana Grand. An invoice and confirmation have been created.
          </p>
        </div>

        {/* Printable Ticket */}
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs printable-ticket">
          
          <div className="bg-[#7B1123] p-6 text-white flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase bg-white/20 px-2 py-0.5 rounded tracking-wider">
                Official Reservation Invoice & Voucher
              </span>
              <h2 className="text-xl font-black tracking-tight">Hotel Saravana Grand</h2>
              <p className="text-xs text-rose-100">Mattuthavani Bus Stand Road, Madurai, Tamil Nadu</p>
            </div>
            
            <div className="text-right">
              <span className="text-[10px] text-rose-200 block uppercase">Booking Reference</span>
              <span className="text-lg font-mono font-black text-white">{booking.bookingId}</span>
            </div>
          </div>

          <div className="p-6 space-y-5 text-xs">
            
            {/* Room & Dates Grid */}
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100">
              <div>
                <span className="text-slate-400 font-medium block">Room Category</span>
                <span className="text-sm font-bold text-slate-900">{booking.roomTypeName}</span>
                {booking.assignedRoomNumber ? (
                  <span className="inline-block mt-1 bg-[#7B1123]/10 text-[#7B1123] text-[10px] font-bold px-2 py-0.5 rounded">
                    Assigned: Room {booking.assignedRoomNumber} (Floor {booking.assignedFloor || booking.roomAllocations?.[0]?.floor || 1})
                  </span>
                ) : (
                  <span className="inline-block mt-1 bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200">
                    Room assigned at check-in {booking.preferredFloor && booking.preferredFloor !== 'any' ? `• Floor ${booking.preferredFloor} Preferred` : ''}
                  </span>
                )}
              </div>

              <div>
                <span className="text-slate-400 font-medium block">Stay Package & Guests</span>
                <span className="font-bold text-slate-900">{booking.stayTypeName || 'Standard Overnight'}</span>
                <span className="text-slate-500 block text-[11px]">
                  {booking.roomsCount || 1} Room(s) • {booking.numberOfGuests} Guest{booking.numberOfGuests > 1 ? 's' : ''}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-medium block">Check-In</span>
                <span className="font-bold text-slate-900">{booking.checkInDate}</span>
                <span className="text-slate-500 block text-[11px]">{booking.checkInTimeStr || '12:00 PM'}</span>
              </div>

              <div>
                <span className="text-slate-400 font-medium block">Check-Out</span>
                <span className="font-bold text-slate-900">{booking.checkOutDate}</span>
                <span className="text-slate-500 block text-[11px]">{booking.checkOutTimeStr || '11:00 AM'}</span>
              </div>
            </div>

            {/* Group Room Allocations (if multiple rooms booked) */}
            {booking.roomAllocations && booking.roomAllocations.length > 0 && (
              <div className="pb-4 border-b border-slate-100 space-y-2">
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Allocated Rooms</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {booking.roomAllocations.map((alloc, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-200/80 p-2.5 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900">{alloc.typeName}</span>
                        <span className="text-[10px] text-slate-500 block">Floor {alloc.floor || 1}</span>
                      </div>
                      <span className="px-2 py-0.5 bg-[#7B1123] text-white text-[11px] font-bold rounded">
                        Room {alloc.roomNumber || 'TBD'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Guest Information */}
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100">
              <div>
                <span className="text-slate-400 font-medium block">Primary Guest</span>
                <span className="font-bold text-slate-900">{booking.customerName || booking.guestName}</span>
              </div>

              <div>
                <span className="text-slate-400 font-medium block">Contact Info</span>
                <span className="font-bold text-slate-900">{booking.customerPhone || booking.guestPhone}</span>
                <span className="text-slate-500 block text-[11px] truncate">{booking.customerEmail || booking.guestEmail}</span>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-slate-600">
                <span>Room Charges ({booking.numberOfNights} Nights, {booking.roomsCount || 1} Room(s))</span>
                <span className="font-bold text-slate-900">₹{(booking.roomTotal || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST Tax (12%)</span>
                <span className="font-bold text-slate-900">₹{(booking.tax || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-100">
                <span>Total Amount Paid</span>
                <span className="text-base text-[#7B1123]">₹{(booking.totalAmount || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-[11px] text-emerald-700 font-bold pt-1">
                <span>Payment Status</span>
                <span className="bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {booking.paymentStatus || 'Paid'} via {booking.paymentMethod || 'Razorpay'}
                </span>
              </div>
            </div>

          </div>

          <div className="bg-slate-50 border-t border-slate-100 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-500 flex items-center gap-1 text-[11px]">
              <Clock size={13} className="text-[#7B1123]" /> 24/7 Front Desk Available for Check-In
            </span>

            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center space-x-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Printer size={14} />
              <span>Print Confirmation</span>
            </button>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center space-x-3 text-xs">
          <Link
            to="/my-bookings"
            className="px-4 py-2.5 bg-[#7B1123] hover:bg-[#600D1B] text-white font-bold rounded-xl shadow-2xs transition-colors"
          >
            View in My Reservations
          </Link>
          <Link
            to="/"
            className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl shadow-2xs transition-colors"
          >
            Return to Hotel Home
          </Link>
        </div>

      </div>

    </div>
  );
};

export default BookingConfirmation;
