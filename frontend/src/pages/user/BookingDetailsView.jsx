import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBookingById } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  CheckCircle2, 
  Calendar, 
  MapPin, 
  Bed, 
  Building2, 
  User, 
  Mail, 
  Phone, 
  ArrowLeft, 
  Printer, 
  ShieldCheck,
  Clock,
  Loader2,
  FileText
} from 'lucide-react';

const BookingDetailsView = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBooking = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await getBookingById(bookingId);
        if (res.data && res.data.booking) {
          setBooking(res.data.booking);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load booking details.');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-6 text-xs font-semibold text-slate-600">
        <Loader2 size={32} className="text-[#7B1123] animate-spin mr-2" />
        <span>Loading invoice #{bookingId}...</span>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-6 space-y-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full text-center space-y-3 shadow-2xs">
          <h2 className="text-lg font-bold text-slate-800">Reservation Record Not Found</h2>
          <p className="text-xs text-slate-500">{error || `No booking found matching ID: ${bookingId}`}</p>
          <button onClick={() => navigate('/my-bookings')} className="px-4 py-2 bg-[#7B1123] text-white text-xs font-bold rounded-xl shadow-2xs cursor-pointer">
            Return to My Reservations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 pb-20 font-sans">
      
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200/90 py-3.5 px-4 sm:px-6 lg:px-8 shadow-2xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between text-xs">
          <button onClick={() => navigate(-1)} className="flex items-center space-x-1.5 font-bold text-[#7B1123] hover:underline cursor-pointer">
            <ArrowLeft size={16} />
            <span>Back to Reservations</span>
          </button>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer size={13} />
              <span>Print Tax Invoice</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        
        {/* Printable Tax Invoice Container */}
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs printable-ticket">
          
          {/* Invoice Header */}
          <div className="bg-[#7B1123] p-6 text-white flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <span className="text-[10px] font-extrabold uppercase bg-white/20 px-2.5 py-0.5 rounded tracking-wider">
                Official Tax Invoice / Receipt
              </span>
              <h1 className="text-2xl font-black tracking-tight mt-1">Hotel Saravana Grand</h1>
              <p className="text-xs text-rose-100">Mattuthavani Bus Stand Road, Madurai, Tamil Nadu 625020</p>
              <p className="text-[11px] text-rose-200">GSTIN: 33AAAAA0000A1Z5 · Phone: +91 452 234 5678</p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] text-rose-200 uppercase font-bold block">Invoice & Booking Ref</span>
              <span className="text-lg font-mono font-black text-white">{booking.bookingId}</span>
              <span className="text-[11px] text-rose-100 block mt-0.5">
                Date: {new Date(booking.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>

          <div className="p-6 space-y-6 text-xs">
            
            {/* Customer & Stay Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-slate-100">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Billed To (Guest)</span>
                <div className="text-sm font-black text-slate-900">{booking.customerName}</div>
                <div className="text-slate-600">{booking.customerEmail}</div>
                <div className="text-slate-600">{booking.customerPhone}</div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Reservation Particulars</span>
                <div className="text-sm font-bold text-[#7B1123]">{booking.roomTypeName}</div>
                <div className="text-slate-700">Stay Package: <strong>{booking.stayTypeName}</strong></div>
                {booking.assignedRoomNumber && (
                  <div className="text-slate-700">Assigned Physical Room: <strong className="bg-[#7B1123]/10 text-[#7B1123] px-2 py-0.5 rounded font-mono font-bold">{booking.assignedRoomNumber}</strong></div>
                )}
                <div className="text-slate-600">Rooms: <strong>{booking.roomsCount || 1} Room(s)</strong> • Guests: <strong>{booking.numberOfGuests}</strong></div>
              </div>
            </div>

            {/* Multi-room allocations if present */}
            {booking.roomAllocations && booking.roomAllocations.length > 0 && (
              <div className="space-y-2 pb-4 border-b border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Allocated Physical Rooms ({booking.roomAllocations.length})</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {booking.roomAllocations.map((alloc, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900">{alloc.typeName}</span>
                        <span className="text-[10px] text-slate-500 block">Floor {alloc.floor || 1} • {alloc.checkInStatus}</span>
                      </div>
                      <span className="px-2 py-0.5 bg-[#7B1123] text-white text-[11px] font-bold rounded">
                        Room {alloc.roomNumber || 'TBD'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Check-In / Check-Out Timings */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <div>
                <span className="text-slate-500 font-medium block">Check-In</span>
                <span className="text-sm font-black text-slate-900">{booking.checkInDate}</span>
                <span className="text-[11px] text-slate-500 block">{booking.checkInTimeStr || '12:00 PM'}</span>
                {booking.checkInTime && (
                  <span className="text-[10px] text-emerald-700 block font-semibold mt-1">
                    Checked in at {new Date(booking.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>

              <div>
                <span className="text-slate-500 font-medium block">Check-Out</span>
                <span className="text-sm font-black text-slate-900">{booking.checkOutDate}</span>
                <span className="text-[11px] text-slate-500 block">{booking.checkOutTimeStr || '11:00 AM'}</span>
                {booking.checkOutTime && (
                  <span className="text-[10px] text-slate-500 block font-semibold mt-1">
                    Completed at {new Date(booking.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Description</th>
                    <th className="p-3 text-center">Nights</th>
                    <th className="p-3 text-right">Rate / Night</th>
                    <th className="p-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  <tr>
                    <td className="p-3 font-semibold">{booking.roomTypeName} ({booking.stayTypeName})</td>
                    <td className="p-3 text-center">{booking.numberOfNights}</td>
                    <td className="p-3 text-right">₹{booking.pricePerNight?.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right font-bold">₹{booking.roomTotal?.toLocaleString('en-IN')}</td>
                  </tr>

                  {booking.additionalCharges > 0 && (
                    <tr>
                      <td className="p-3 text-slate-700">
                        Additional Charges ({booking.additionalChargesDescription || 'Room Service & Minibar'})
                      </td>
                      <td className="p-3 text-center">-</td>
                      <td className="p-3 text-right">-</td>
                      <td className="p-3 text-right font-bold">₹{booking.additionalCharges?.toLocaleString('en-IN')}</td>
                    </tr>
                  )}

                  <tr>
                    <td className="p-3 text-slate-600">Goods and Services Tax (GST @ 12%)</td>
                    <td className="p-3 text-center">-</td>
                    <td className="p-3 text-right">12%</td>
                    <td className="p-3 text-right font-bold">₹{booking.tax?.toLocaleString('en-IN')}</td>
                  </tr>
                </tbody>
                <tfoot className="bg-slate-50 font-black text-slate-900 border-t border-slate-200">
                  <tr>
                    <td colSpan={3} className="p-3 text-right uppercase text-[11px] tracking-wider">Total Amount Paid</td>
                    <td className="p-3 text-right text-base text-[#7B1123]">₹{booking.totalAmount?.toLocaleString('en-IN')}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Payment & Status Footnotes */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2 text-[11px]">
              <div>
                <span className="text-slate-500">Payment Status: </span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {booking.paymentStatus || 'Paid'} via {booking.paymentMethod || 'Razorpay'}
                </span>
                <span className="text-slate-400 ml-2">Txn: {booking.transactionId || 'TXN-DIRECT'}</span>
              </div>

              <div>
                <span className="text-slate-500">Booking Status: </span>
                <span className="font-bold text-slate-900 uppercase">{booking.bookingStatus}</span>
              </div>
            </div>

          </div>

          <div className="bg-slate-50 border-t border-slate-100 p-4 text-center text-[10px] text-slate-400">
            This is a computer-generated tax invoice issued by Hotel Saravana Grand management system.
          </div>

        </div>

      </div>

    </div>
  );
};

export default BookingDetailsView;
