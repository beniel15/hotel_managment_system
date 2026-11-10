import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import RazorpayModal from '../../components/RazorpayModal';
import { createOnlineBooking } from '../../services/api';
import { 
  Building2, 
  Calendar, 
  Users, 
  ShieldCheck, 
  Lock, 
  CreditCard, 
  ArrowLeft,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Clock,
  BedDouble
} from 'lucide-react';

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const bookingPayload = location.state?.bookingPayload;
  const hotel = location.state?.hotel;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  if (!bookingPayload) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] text-slate-800 flex items-center justify-center p-6 font-sans">
        <div className="text-center space-y-3 max-w-md bg-white border border-slate-200 p-8 rounded-2xl shadow-2xs">
          <h2 className="text-lg font-bold text-slate-900">No Active Booking Session</h2>
          <p className="text-xs text-slate-500">Please choose your dates and select a room to begin your reservation.</p>
          <button 
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-[#7B1123] hover:bg-[#600D1B] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Browse Available Rooms
          </button>
        </div>
      </div>
    );
  }

  const handlePaymentSuccess = async (paymentMeta) => {
    setIsModalOpen(false);
    setSubmitting(true);
    setErrorMessage(null);

    const completeRecord = {
      ...bookingPayload,
      paymentMethod: `Razorpay (${paymentMeta?.paymentMethod || 'UPI'})`,
      razorpayPaymentId: paymentMeta?.razorpayPaymentId || ('pay_' + Math.random().toString(36).substring(2, 10).toUpperCase())
    };

    try {
      // Send reservation request to backend with concurrency and date overlap validation
      const response = await createOnlineBooking(completeRecord);

      if (response.data && response.data.success) {
        const confirmedBooking = response.data.booking;
        navigate('/booking-confirmation', { state: { booking: confirmedBooking } });
      }
    } catch (error) {
      if (error.response && error.response.status === 409) {
        // Double-booking concurrency conflict detected
        const conflictMsg = error.response.data.message || 'Room was just booked by another guest for overlapping dates!';
        setErrorMessage(conflictMsg);
      } else {
        const msg = error.response?.data?.message || error.message || 'Payment processing failed. Please try again.';
        setErrorMessage(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 pb-20 font-sans">
      
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200/90 py-3.5 px-4 sm:px-6 lg:px-8 shadow-2xs">
        <div className="max-w-3xl mx-auto flex items-center justify-between text-xs">
          <button onClick={() => navigate(-1)} className="flex items-center space-x-1.5 font-bold text-[#7B1123] hover:underline cursor-pointer">
            <ArrowLeft size={16} />
            <span>Modify Details</span>
          </button>
          
          <div className="text-slate-500 font-medium">
            Step 2 of 2: Payment Checkout & Confirmation
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        
        <div className="text-center space-y-1">
          <span className="bg-[#7B1123]/10 text-[#7B1123] text-[10px] font-bold px-2.5 py-0.5 rounded tracking-wide uppercase">
            Secure Payment Gateway
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Review & Pay</h1>
          <p className="text-xs text-slate-500">
            Your physical room will be atomically reserved and registered upon successful payment verification.
          </p>
        </div>

        {/* Concurrency Overlap Error Banner */}
        {errorMessage && (
          <div className="bg-rose-50 border border-rose-300 p-4 rounded-2xl flex items-start space-x-3 text-xs text-rose-800 shadow-2xs">
            <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-rose-900">Reservation Conflict Detected</div>
              <p className="mt-0.5 leading-relaxed">{errorMessage}</p>
              <button 
                onClick={() => navigate('/book')}
                className="mt-2.5 px-3 py-1.5 bg-[#7B1123] hover:bg-[#600D1B] text-white font-bold rounded-lg text-[11px] transition-colors cursor-pointer"
              >
                Choose Alternative Rooms or Dates
              </button>
            </div>
          </div>
        )}

        {/* Booking Summary Box */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-4 shadow-2xs">
          
          <div className="border-b border-slate-100 pb-3 flex items-start justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">{bookingPayload.roomTypeName}</h2>
              <p className="text-xs text-[#7B1123] font-semibold">{hotel?.name || 'Hotel Saravana Grand'} · {hotel?.city || 'Madurai'}</p>
            </div>
            <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-lg">
              {bookingPayload.roomsCount || 1} Room{(bookingPayload.roomsCount || 1) > 1 ? 's' : ''}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-medium block">Check-In</span>
              <span className="font-bold text-slate-900">{bookingPayload.checkInDate}</span>
              <span className="text-[11px] text-slate-500 block">{bookingPayload.checkInTimeStr || '12:00 PM'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Check-Out</span>
              <span className="font-bold text-slate-900">{bookingPayload.checkOutDate}</span>
              <span className="text-[11px] text-slate-500 block">{bookingPayload.checkOutTimeStr || '11:00 AM'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Package & Duration</span>
              <span className="font-bold text-slate-900">{bookingPayload.stayTypeName || 'Standard Overnight'}</span>
              <span className="text-[11px] text-slate-500 block">{bookingPayload.numberOfNights} Night{bookingPayload.numberOfNights > 1 ? 's' : ''}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Guests</span>
              <span className="font-bold text-slate-900">
                {bookingPayload.adultsCount || bookingPayload.numberOfGuests} Adults
                {bookingPayload.childrenCount > 0 ? `, ${bookingPayload.childrenCount} Children` : ''}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Guest Name</span>
              <span className="font-bold text-slate-900">{bookingPayload.guestName}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Contact Phone</span>
              <span className="font-bold text-slate-900">{bookingPayload.guestPhone}</span>
            </div>
          </div>

          {/* Pricing Total */}
          <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600 font-medium">
              <span>Room Charges ({bookingPayload.numberOfNights} Nights, {bookingPayload.roomsCount || 1} Room(s))</span>
              <span className="font-bold text-slate-900">₹{(bookingPayload.roomTotal || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-slate-600 font-medium">
              <span>Taxes & Service Charges (12% GST)</span>
              <span className="font-bold text-slate-900">₹{(bookingPayload.tax || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-100">
              <span>Total Payable</span>
              <span className="text-[#7B1123]">₹{(bookingPayload.totalAmount || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              disabled={submitting}
              onClick={() => setIsModalOpen(true)}
              className="w-full py-3.5 bg-[#7B1123] hover:bg-[#600D1B] text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-2xs transition-colors cursor-pointer disabled:opacity-70"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Validating & Confirming Reservation...</span>
                </>
              ) : (
                <>
                  <CreditCard size={16} />
                  <span>Pay Now & Confirm (₹{(bookingPayload.totalAmount || 0).toLocaleString('en-IN')})</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>

      {/* Razorpay Simulated Modal */}
      <RazorpayModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        amount={bookingPayload.totalAmount}
        bookingDetails={bookingPayload}
        onPaymentSuccess={handlePaymentSuccess}
      />

    </div>
  );
};

export default Payment;
