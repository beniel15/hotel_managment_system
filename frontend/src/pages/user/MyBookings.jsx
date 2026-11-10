import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getMyBookings, cancelBooking, submitReview } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import GuestAccountLayout from '../../components/GuestAccountLayout';
import { 
  Calendar, 
  Bed, 
  Users,
  CheckCircle2, 
  Loader2,
  Clock, 
  FileText, 
  Star, 
  X, 
  AlertCircle
} from 'lucide-react';

const MyBookings = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('UPCOMING');
  const [actionLoading, setActionLoading] = useState(null);

  // Review Modal State
  const [reviewBooking, setReviewBooking] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [reviewError, setReviewError] = useState('');

  const fetchUserBookings = async () => {
    setLoading(true);
    try {
      const res = await getMyBookings();
      if (res.data && res.data.bookings) {
        setBookings(res.data.bookings);
      } else {
        setBookings([]);
      }
    } catch (err) {
      console.warn('User bookings notice:', err);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserBookings();
  }, []);

  const handleCancel = async (bookingId) => {
    const reason = prompt('Please specify the reason for cancellation:', 'Schedule change');
    if (reason === null) return;

    setActionLoading(bookingId);
    try {
      await cancelBooking(bookingId, reason);
      setBookings(prev => prev.map(b => 
        b.bookingId === bookingId ? { ...b, bookingStatus: 'Cancelled', paymentStatus: 'Refunded' } : b
      ));
    } catch (err) {
      alert(err.response?.data?.message || 'Cancellation failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenReview = (booking) => {
    setReviewBooking(booking || (bookings.length > 0 ? bookings[0] : null));
    setRating(5);
    setComment('');
    setReviewSuccess('');
    setReviewError('');
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      setReviewError('Please enter your feedback.');
      return;
    }

    setSubmittingReview(true);
    setReviewError('');
    try {
      await submitReview({
        bookingId: reviewBooking?.bookingId || bookings[0]?.bookingId,
        rating,
        comment: comment.trim()
      });
      setReviewSuccess('Thank you! Your verified review has been published.');
      setTimeout(() => {
        setReviewBooking(null);
      }, 1200);
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Could not submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const filteredBookings = bookings.filter(b => {
    const status = b.bookingStatus || 'Confirmed';
    if (activeTab === 'UPCOMING') return status === 'Confirmed' || status === 'Checked-In' || status === 'Pending';
    if (activeTab === 'COMPLETED') return status === 'Completed';
    if (activeTab === 'CANCELLED') return status === 'Cancelled';
    return true;
  });

  const upcomingCount = bookings.filter(b => b.bookingStatus === 'Confirmed' || b.bookingStatus === 'Checked-In' || b.bookingStatus === 'Pending').length;
  const completedCount = bookings.filter(b => b.bookingStatus === 'Completed').length;
  const cancelledCount = bookings.filter(b => b.bookingStatus === 'Cancelled').length;

  const formatDateRange = (checkIn, checkOut, nights) => {
    if (!checkIn || !checkOut) return '';
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    const s1 = d1.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    const s2 = d2.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    return `${s1} – ${s2} (${nights || 1} Nights)`;
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 pb-16 font-sans">
      <GuestAccountLayout>
        <div className="space-y-6">
          
          {/* Header Title */}
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Bookings</h1>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setActiveTab('UPCOMING')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'UPCOMING'
                  ? 'bg-[#7B1123] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Upcoming ({upcomingCount})
            </button>

            <button
              onClick={() => setActiveTab('COMPLETED')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'COMPLETED'
                  ? 'bg-[#7B1123] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Completed ({completedCount})
            </button>

            <button
              onClick={() => setActiveTab('CANCELLED')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'CANCELLED'
                  ? 'bg-[#7B1123] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Cancelled ({cancelledCount})
            </button>
          </div>

          {/* Bookings List */}
          {loading ? (
            <div className="p-16 text-center space-y-2 bg-white rounded-2xl border border-slate-200/90 shadow-xs">
              <Loader2 size={32} className="text-[#7B1123] animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-semibold">Loading your reservations...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center max-w-md mx-auto space-y-3">
              <Calendar size={36} className="text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No Reservations Yet</h3>
              <p className="text-xs text-slate-500">
                You have no bookings under the "{activeTab.toLowerCase()}" category.
              </p>
              <Link 
                to="/" 
                className="inline-block px-4 py-2 bg-[#7B1123] hover:bg-[#600D1B] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
              >
                Browse Available Rooms
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((b) => {
                const status = b.bookingStatus || 'Confirmed';
                const nights = b.nights || 1;
                const unitPrice = b.pricePerNight || Math.round((b.totalAmount || 0) / nights);

                return (
                  <div 
                    key={b.bookingId}
                    className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row gap-5 items-center justify-between"
                  >
                    {/* Left: Thumbnail & Details */}
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full md:w-auto">
                      <img
                        src={b.roomImage || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80'}
                        alt={b.roomTypeName || 'Room'}
                        className="w-full sm:w-44 h-28 object-cover rounded-xl shrink-0"
                      />

                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2.5">
                          <h3 className="text-base font-bold text-slate-900">
                            {b.roomTypeName || 'Room Booking'}
                          </h3>
                          {status === 'Confirmed' && (
                            <span className="bg-[#E8F8EE] text-[#1B7A42] text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                              Confirmed
                            </span>
                          )}
                          {status === 'Checked-In' && (
                            <span className="bg-[#FEF3D6] text-[#9A6B00] text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                              Checked-In
                            </span>
                          )}
                          {status === 'Completed' && (
                            <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                              Completed
                            </span>
                          )}
                          {status === 'Cancelled' && (
                            <span className="bg-[#FCE4E8] text-[#7B1123] text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                              Cancelled
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                          <Calendar size={13} className="text-slate-400 shrink-0" />
                          <span>{formatDateRange(b.checkInDate, b.checkOutDate, nights)}</span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                          <Users size={13} className="text-slate-400 shrink-0" />
                          <span>{b.roomsCount || 1} Room(s) • {b.numberOfGuests || 2} Guests</span>
                        </div>

                        {b.assignedRoomNumber && (
                          <div className="text-[11px] font-bold text-[#7B1123]">
                            Assigned Room: {b.assignedRoomNumber} (Floor {b.assignedFloor || (b.roomAllocations?.[0]?.floor) || 1})
                          </div>
                        )}

                        <div className="text-[11px] text-slate-400 font-medium">
                          Booking ID: <span className="text-slate-700 font-semibold">{b.bookingId}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Price & Buttons */}
                    <div className="flex flex-col items-start md:items-end justify-between w-full md:w-auto space-y-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                      <div className="text-left md:text-right">
                        <div className="text-lg font-extrabold text-slate-900 leading-none">
                          ₹{(b.totalAmount || 0).toLocaleString('en-IN')}
                        </div>
                        {unitPrice > 0 && (
                          <div className="text-[11px] text-slate-400 font-medium mt-1">
                            (₹{unitPrice?.toLocaleString('en-IN')} x {nights} Nights)
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/bookings/${b.bookingId}`)}
                          className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          View Details
                        </button>

                        {status !== 'Cancelled' && status !== 'Completed' && (
                          <button
                            type="button"
                            disabled={actionLoading === b.bookingId}
                            onClick={() => handleCancel(b.bookingId)}
                            className="px-3.5 py-1.5 rounded-lg bg-[#7B1123] hover:bg-[#600D1B] text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
                          >
                            {actionLoading === b.bookingId ? 'Cancelling...' : 'Modify / Cancel'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick Actions */}
          <div className="pt-2 space-y-3">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Quick Actions</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link
                to="/"
                className="bg-white border border-slate-200/90 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs hover:border-[#7B1123]/40 hover:shadow-sm transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#7B1123] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Calendar size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 group-hover:text-[#7B1123] transition-colors">
                    Book a Room
                  </h3>
                  <p className="text-[11px] text-slate-400">Plan your next stay</p>
                </div>
              </Link>

              <button
                type="button"
                onClick={() => {
                  if (bookings.length > 0) {
                    navigate(`/bookings/${bookings[0].bookingId}`);
                  } else {
                    alert('You have no reservations to download invoices for.');
                  }
                }}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 flex items-center gap-3.5 text-left shadow-xs hover:border-[#7B1123]/40 hover:shadow-sm transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#7B1123] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 group-hover:text-[#7B1123] transition-colors">
                    Download Invoice
                  </h3>
                  <p className="text-[11px] text-slate-400">Get your booking bill</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (bookings.length > 0) {
                    handleOpenReview(bookings[0]);
                  } else {
                    alert('Please book and complete a stay before leaving a review.');
                  }
                }}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 flex items-center gap-3.5 text-left shadow-xs hover:border-[#7B1123]/40 hover:shadow-sm transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#7B1123] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Star size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 group-hover:text-[#7B1123] transition-colors">
                    Leave a Review
                  </h3>
                  <p className="text-[11px] text-slate-400">Share your experience</p>
                </div>
              </button>
            </div>
          </div>

        </div>

        {/* Review Modal */}
        {reviewBooking && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative border border-slate-200">
              <button 
                onClick={() => setReviewBooking(null)}
                className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X size={18} />
              </button>

              <div className="text-center space-y-1 mb-5">
                <div className="w-12 h-12 bg-rose-50 text-[#7B1123] rounded-full flex items-center justify-center mx-auto mb-2">
                  <Star size={24} className="fill-[#7B1123]" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Share Your Stay Review</h3>
                <p className="text-xs text-slate-500">
                  Rating for {reviewBooking.roomTypeName || 'Room'} (Booking #{reviewBooking.bookingId})
                </p>
              </div>

              {reviewSuccess ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                  <CheckCircle2 size={32} className="text-[#1B7A42] mx-auto" />
                  <p className="text-xs font-bold text-emerald-900">{reviewSuccess}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  {reviewError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                      <AlertCircle size={15} />
                      <span>{reviewError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 text-center">
                      Your Rating (1 to 5 Stars)
                    </label>
                    <div className="flex justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="p-1 hover:scale-125 transition-transform"
                        >
                          <Star 
                            size={28} 
                            className={star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'} 
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Stay Feedback</label>
                    <textarea
                      rows={3}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share your stay experience..."
                      className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:border-[#7B1123]"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setReviewBooking(null)}
                      className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="flex-1 py-2.5 rounded-xl bg-[#7B1123] hover:bg-[#600D1B] text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2"
                    >
                      {submittingReview ? <Loader2 size={15} className="animate-spin" /> : null}
                      <span>Submit Review</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </GuestAccountLayout>
    </div>
  );
};

export default MyBookings;
