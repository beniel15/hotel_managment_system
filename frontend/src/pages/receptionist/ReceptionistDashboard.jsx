import React, { useState, useEffect } from 'react';
import { 
  getAllBookings, 
  getPhysicalRooms, 
  getRoomTypes,
  checkInGuest, 
  checkOutGuest, 
  createWalkInBooking, 
  updateRoomStatus,
  cleanPhysicalRoom,
  assignRoomToBooking,
  cancelBooking
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PortalShell from '../../components/PortalShell';
import { 
  Calendar, 
  LogOut, 
  CheckCircle2, 
  Clock, 
  Loader2,
  User, 
  Plus, 
  X, 
  CreditCard, 
  BedDouble, 
  LayoutDashboard, 
  ClipboardList, 
  UserPlus, 
  LogIn, 
  ArrowRight, 
  UserCheck, 
  Search,
  Eye,
  Sparkles,
  AlertTriangle,
  Layers,
  Phone,
  Mail,
  Filter,
  Check,
  Ban
} from 'lucide-react';

const ReceptionistDashboard = () => {
  const { currentUser } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [actionLoading, setActionLoading] = useState(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [floorFilter, setFloorFilter] = useState('ALL');

  // Booking Details Modal
  const [viewBookingDetails, setViewBookingDetails] = useState(null);

  // Room Assignment Modal
  const [assignModalBooking, setAssignModalBooking] = useState(null);
  const [selectedRoomToAssign, setSelectedRoomToAssign] = useState('');
  const [selectedAllocationId, setSelectedAllocationId] = useState('');

  // Check-In Modal State
  const [checkInModalBooking, setCheckInModalBooking] = useState(null);
  const [assignedRoomSelection, setAssignedRoomSelection] = useState('');

  // Check-Out Modal State
  const [checkOutBooking, setCheckOutBooking] = useState(null);
  const [extraCharges, setExtraCharges] = useState(0);
  const [extraDesc, setExtraDesc] = useState('');
  const [submittingCheckOut, setSubmittingCheckOut] = useState(false);

  // Cancellation Modal State
  const [cancelModalBooking, setCancelModalBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [submittingCancel, setSubmittingCancel] = useState(false);

  // Walk-In Modal State
  const [isWalkInOpen, setIsWalkInOpen] = useState(false);
  const [wiName, setWiName] = useState('');
  const [wiPhone, setWiPhone] = useState('');
  const [wiEmail, setWiEmail] = useState('');
  const [wiTypeId, setWiTypeId] = useState('');
  const [wiRoomNumber, setWiRoomNumber] = useState('');
  const [wiCheckIn, setWiCheckIn] = useState(() => new Date().toISOString().split('T')[0]);
  const [wiCheckOut, setWiCheckOut] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [wiGuests, setWiGuests] = useState(2);
  const [wiPackage, setWiPackage] = useState('standard_overnight');
  const [wiPayMethod, setWiPayMethod] = useState('Cash (Front Desk)');
  const [wiInstantCheckIn, setWiInstantCheckIn] = useState(true);
  const [submittingWalkIn, setSubmittingWalkIn] = useState(false);
  const [walkInSuccessMsg, setWalkInSuccessMsg] = useState('');

  // Fetch Dashboard Data from Backend
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [bRes, rRes, tRes] = await Promise.allSettled([
        getAllBookings(),
        getPhysicalRooms(),
        getRoomTypes()
      ]);

      if (bRes.status === 'fulfilled' && bRes.value.data?.bookings) {
        setBookings(bRes.value.data.bookings);
      } else {
        setBookings([]);
      }

      if (rRes.status === 'fulfilled' && rRes.value.data?.rooms) {
        setRooms(rRes.value.data.rooms);
      } else {
        setRooms([]);
      }

      if (tRes.status === 'fulfilled' && tRes.value.data?.roomTypes) {
        setRoomTypes(tRes.value.data.roomTypes);
        if (!wiTypeId && tRes.value.data.roomTypes.length > 0) {
          setWiTypeId(tRes.value.data.roomTypes[0].typeId);
        }
      }
    } catch (err) {
      console.warn('Reception dashboard fetch notice:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Today string helper
  const todayStr = new Date().toISOString().split('T')[0];

  // REAL METRICS (Calculated from actual database / memory records)
  const todayArrivalsList = bookings.filter(b => {
    const cin = b.checkInDate ? b.checkInDate.split('T')[0] : '';
    return cin === todayStr && (b.bookingStatus === 'Confirmed' || b.bookingStatus === 'Pending');
  });

  const todayDeparturesList = bookings.filter(b => {
    const cout = b.checkOutDate ? b.checkOutDate.split('T')[0] : '';
    return cout === todayStr && b.bookingStatus === 'Checked-In';
  });

  const upcomingArrivalsList = bookings.filter(b => {
    const cin = b.checkInDate ? b.checkInDate.split('T')[0] : '';
    return cin > todayStr && b.bookingStatus === 'Confirmed';
  });

  const occupiedRooms = rooms.filter(r => r.status === 'Occupied');
  const availableRooms = rooms.filter(r => r.status === 'Available');
  const cleaningRooms = rooms.filter(r => r.status === 'Cleaning');
  const maintenanceRooms = rooms.filter(r => r.status === 'Under Maintenance');
  const reservedRooms = rooms.filter(r => r.status === 'Reserved');

  // Handle Check-In
  const handleOpenCheckInModal = (booking) => {
    setCheckInModalBooking(booking);
    setAssignedRoomSelection(booking.assignedRoomNumber || '');
  };

  const handleConfirmCheckIn = async (e) => {
    e.preventDefault();
    if (!checkInModalBooking) return;

    const bId = checkInModalBooking.bookingId;
    const roomToAssign = assignedRoomSelection || checkInModalBooking.assignedRoomNumber;

    setActionLoading(bId);
    try {
      await checkInGuest(bId, roomToAssign);
      
      setBookings(prev => prev.map(b => 
        b.bookingId === bId ? { ...b, bookingStatus: 'Checked-In', assignedRoomNumber: roomToAssign, checkInTime: new Date() } : b
      ));

      if (roomToAssign) {
        const assignedNums = String(roomToAssign).split(',').map(s => s.trim());
        setRooms(prev => prev.map(r => 
          assignedNums.includes(r.roomNumber) ? { ...r, status: 'Occupied', currentBookingId: bId } : r
        ));
      }

      setCheckInModalBooking(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Check-in failed.');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Check-Out
  const handleOpenCheckOutModal = (booking) => {
    setCheckOutBooking(booking);
    setExtraCharges(0);
    setExtraDesc('');
  };

  const handleConfirmCheckOut = async (e) => {
    e.preventDefault();
    if (!checkOutBooking) return;

    const bId = checkOutBooking.bookingId;
    setSubmittingCheckOut(true);
    try {
      await checkOutGuest(bId, extraCharges, extraDesc);

      setBookings(prev => prev.map(b => {
        if (b.bookingId === bId) {
          const total = (b.totalAmount || 0) + Number(extraCharges || 0);
          return { ...b, bookingStatus: 'Completed', checkOutTime: new Date(), additionalCharges: extraCharges, totalAmount: total };
        }
        return b;
      }));

      // Room operational status transitions to Cleaning
      if (checkOutBooking.assignedRoomNumber) {
        const assignedNums = String(checkOutBooking.assignedRoomNumber).split(',').map(s => s.trim());
        setRooms(prev => prev.map(r => 
          assignedNums.includes(r.roomNumber) ? { ...r, status: 'Cleaning', currentBookingId: null, lastCleanedAt: new Date() } : r
        ));
      }

      setCheckOutBooking(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Check-out failed.');
    } finally {
      setSubmittingCheckOut(false);
    }
  };

  // Handle Housekeeping Cleaning -> Available Action
  const handleMarkClean = async (roomNumber) => {
    try {
      await cleanPhysicalRoom(roomNumber);
      setRooms(prev => prev.map(r => 
        r.roomNumber === roomNumber ? { ...r, status: 'Available', maintenanceNotes: '', lastCleanedAt: new Date() } : r
      ));
    } catch (err) {
      console.warn('Room clean update notice:', err);
    }
  };

  // Handle Operational Room Status Toggle
  const handleToggleRoomStatus = async (roomNumber, currentStatus) => {
    let nextStatus = 'Available';
    if (currentStatus === 'Cleaning') nextStatus = 'Available';
    else if (currentStatus === 'Available') nextStatus = 'Cleaning';
    else return;

    try {
      await updateRoomStatus(roomNumber, nextStatus);
      setRooms(prev => prev.map(r => r.roomNumber === roomNumber ? { ...r, status: nextStatus } : r));
    } catch (err) {
      console.warn('Room status update error:', err);
    }
  };

  // Handle Assign Room Modal Open & Save
  const handleOpenAssignModal = (booking, allocation = null) => {
    setAssignModalBooking(booking);
    setSelectedAllocationId(allocation?.allocationId || '');
    setSelectedRoomToAssign(allocation?.roomNumber || booking.assignedRoomNumber || '');
  };

  const handleConfirmRoomAssignment = async (e) => {
    e.preventDefault();
    if (!assignModalBooking || !selectedRoomToAssign) return;

    try {
      const res = await assignRoomToBooking(
        assignModalBooking.bookingId,
        selectedRoomToAssign,
        selectedAllocationId || undefined
      );

      if (res.data?.booking) {
        setBookings(prev => prev.map(b => 
          b.bookingId === assignModalBooking.bookingId ? res.data.booking : b
        ));
      }
      setAssignModalBooking(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Room assignment failed.');
    }
  };

  // Handle Booking Cancellation
  const handleOpenCancelModal = (booking) => {
    setCancelModalBooking(booking);
    setCancelReason('Guest requested cancellation at front desk');
  };

  const handleConfirmCancel = async (e) => {
    e.preventDefault();
    if (!cancelModalBooking) return;

    setSubmittingCancel(true);
    try {
      await cancelBooking(cancelModalBooking.bookingId, cancelReason);
      setBookings(prev => prev.map(b => 
        b.bookingId === cancelModalBooking.bookingId ? { ...b, bookingStatus: 'Cancelled', paymentStatus: 'Refunded' } : b
      ));
      fetchDashboardData();
      setCancelModalBooking(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Cancellation failed.');
    } finally {
      setSubmittingCancel(false);
    }
  };

  // Handle Walk-In Form Submit
  const handleCreateWalkIn = async (e) => {
    e.preventDefault();
    setSubmittingWalkIn(true);
    setWalkInSuccessMsg('');

    try {
      const payload = {
        guestName: wiName,
        guestPhone: wiPhone,
        guestEmail: wiEmail,
        typeId: wiTypeId,
        roomNumber: wiRoomNumber || undefined,
        checkInDate: wiCheckIn,
        checkOutDate: wiCheckOut,
        numberOfGuests: wiGuests,
        stayPackage: wiPackage,
        paymentMethod: wiPayMethod,
        immediateCheckIn: wiInstantCheckIn
      };

      const res = await createWalkInBooking(payload);
      if (res.data?.booking) {
        setWalkInSuccessMsg(`Walk-in booked! Room ${res.data.booking.assignedRoomNumber || 'Reserved'} registered.`);
        fetchDashboardData();
        setTimeout(() => {
          setIsWalkInOpen(false);
          setWalkInSuccessMsg('');
          setWiName('');
          setWiPhone('');
          setWiEmail('');
        }, 1200);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Walk-in booking failed.');
    } finally {
      setSubmittingWalkIn(false);
    }
  };

  // Date format for top pill
  const formattedToday = new Date().toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  // Filtered Bookings for Table
  const filteredBookings = bookings.filter(b => {
    const matchesSearch = !searchTerm || 
      b.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      b.bookingId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.customerPhone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.assignedRoomNumber?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || b.bookingStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Group Rooms by Floor
  const floors = [1, 2, 3];
  const filteredRooms = rooms.filter(r => floorFilter === 'ALL' || r.floor === Number(floorFilter));

  return (
    <PortalShell
      brandSubtitle="Front Desk System"
      headerTitle="Receptionist Dashboard"
      headerRight={
        <div className="flex items-center gap-2">
          {/* Real Live Date Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs">
            <Calendar size={13} className="text-[#7B1123]" />
            <span>{formattedToday}</span>
          </div>

          <button
            onClick={() => setIsWalkInOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#7B1123] hover:bg-[#600D1B] text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Plus size={14} />
            <span>+ Walk-In Booking</span>
          </button>
        </div>
      }
      navItems={[
        { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard, active: activeTab === 'DASHBOARD', onClick: () => setActiveTab('DASHBOARD') },
        { id: 'RESERVATIONS', label: 'Reservations', icon: ClipboardList, active: activeTab === 'RESERVATIONS', onClick: () => setActiveTab('RESERVATIONS') },
        { id: 'WALKIN', label: 'Walk-In Booking', icon: UserPlus, active: false, onClick: () => setIsWalkInOpen(true) },
        { id: 'CHECKIN', label: 'Check-In', icon: LogIn, active: activeTab === 'CHECKIN', onClick: () => setActiveTab('CHECKIN') },
        { id: 'CHECKOUT', label: 'Check-Out', icon: LogOut, active: activeTab === 'CHECKOUT', onClick: () => setActiveTab('CHECKOUT') },
        { id: 'ROOMSTATUS', label: 'Room Status Grid', icon: BedDouble, active: activeTab === 'ROOMSTATUS', onClick: () => setActiveTab('ROOMSTATUS') },
        { id: 'PAYMENTS', label: 'Payments', icon: CreditCard, active: activeTab === 'PAYMENTS', onClick: () => setActiveTab('PAYMENTS') },
        { id: 'GUESTS', label: 'Guest Records', icon: UserCheck, active: activeTab === 'GUESTS', onClick: () => setActiveTab('GUESTS') }
      ]}
    >
      <div className="space-y-6">

        {/* ================= VIEW 1: DASHBOARD ================= */}
        {activeTab === 'DASHBOARD' && (
          <div className="space-y-6">

            {/* 6 KEY METRIC COUNTERS FROM REAL DATA */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
              
              {/* Metric 1: Today's Check-ins */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-500 block">Today's Check-Ins</span>
                <div className="text-2xl font-black text-slate-900 mt-1">{todayArrivalsList.length}</div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Scheduled arrivals</span>
              </div>

              {/* Metric 2: Today's Check-outs */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-500 block">Today's Check-Outs</span>
                <div className="text-2xl font-black text-slate-900 mt-1">{todayDeparturesList.length}</div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Scheduled departures</span>
              </div>

              {/* Metric 3: Occupied Rooms */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-500 block">Occupied Rooms</span>
                <div className="text-2xl font-black text-[#7B1123] mt-1">{occupiedRooms.length}</div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">In-house guests</span>
              </div>

              {/* Metric 4: Available Rooms */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-500 block">Available / Clean</span>
                <div className="text-2xl font-black text-emerald-600 mt-1">{availableRooms.length}</div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Ready for guest stay</span>
              </div>

              {/* Metric 5: Rooms Needing Cleaning */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-500 block">Needing Cleaning</span>
                <div className="text-2xl font-black text-amber-600 mt-1">{cleaningRooms.length}</div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Post-checkout cleanup</span>
              </div>

              {/* Metric 6: Upcoming Arrivals */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-500 block">Upcoming Arrivals</span>
                <div className="text-2xl font-black text-slate-800 mt-1">{upcomingArrivalsList.length}</div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Future bookings</span>
              </div>

            </div>

            {/* DUAL TABLES (TODAY'S ARRIVALS & TODAY'S DEPARTURES) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Left Table: Today's Arrivals */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <LogIn size={15} className="text-[#7B1123]" />
                    <h3 className="text-sm font-bold text-slate-900">Today's Arrivals</h3>
                  </div>
                  <button 
                    onClick={() => setActiveTab('RESERVATIONS')} 
                    className="text-xs font-bold text-[#7B1123] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View All</span>
                    <ArrowRight size={12} />
                  </button>
                </div>

                <div className="overflow-x-auto min-h-[140px]">
                  {todayArrivalsList.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No customer arrivals scheduled for today.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-slate-400 font-bold uppercase text-[10px] border-b border-slate-100">
                          <th className="py-2">Booking ID</th>
                          <th className="py-2">Guest Name</th>
                          <th className="py-2">Rooms</th>
                          <th className="py-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {todayArrivalsList.map((row) => (
                          <tr key={row.bookingId} className="hover:bg-slate-50/70">
                            <td className="py-2.5 font-bold text-slate-900">{row.bookingId}</td>
                            <td className="py-2.5 text-slate-700">{row.customerName}</td>
                            <td className="py-2.5 text-slate-700">
                              <span className="font-bold text-[#7B1123]">{row.assignedRoomNumber || 'Unassigned'}</span>
                              <span className="text-[10px] text-slate-400 block">{row.roomsCount || 1} Room(s)</span>
                            </td>
                            <td className="py-2.5 text-right">
                              <button
                                onClick={() => handleOpenCheckInModal(row)}
                                className="px-3 py-1 bg-[#7B1123] hover:bg-[#600D1B] text-white rounded-md text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                              >
                                Check-In
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Right Table: Today's Departures */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <LogOut size={15} className="text-[#7B1123]" />
                    <h3 className="text-sm font-bold text-slate-900">Today's Departures</h3>
                  </div>
                  <button 
                    onClick={() => setActiveTab('RESERVATIONS')} 
                    className="text-xs font-bold text-[#7B1123] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View All</span>
                    <ArrowRight size={12} />
                  </button>
                </div>

                <div className="overflow-x-auto min-h-[140px]">
                  {todayDeparturesList.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No customer departures scheduled for today.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-slate-400 font-bold uppercase text-[10px] border-b border-slate-100">
                          <th className="py-2">Booking ID</th>
                          <th className="py-2">Guest Name</th>
                          <th className="py-2">Rooms</th>
                          <th className="py-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {todayDeparturesList.map((row) => (
                          <tr key={row.bookingId} className="hover:bg-slate-50/70">
                            <td className="py-2.5 font-bold text-slate-900">{row.bookingId}</td>
                            <td className="py-2.5 text-slate-700">{row.customerName}</td>
                            <td className="py-2.5 text-slate-700">{row.assignedRoomNumber}</td>
                            <td className="py-2.5 text-right">
                              <button
                                onClick={() => handleOpenCheckOutModal(row)}
                                className="px-3 py-1 bg-slate-900 hover:bg-black text-white rounded-md text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                              >
                                Check-Out
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

            </div>

            {/* ROOM STATUS QUICK VIEW */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Room Status Grid</h3>
                  <p className="text-[11px] text-slate-500">Live physical room operational status. Click 'Cleaning' to mark 'Available'.</p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#1B7A42]" />
                    <span className="text-slate-700">Available ({availableRooms.length})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#7B1123]" />
                    <span className="text-slate-700">Occupied ({occupiedRooms.length})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#9A6B00]" />
                    <span className="text-slate-700">Cleaning ({cleaningRooms.length})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#623697]" />
                    <span className="text-slate-700">Maintenance ({maintenanceRooms.length})</span>
                  </div>
                  <button 
                    onClick={() => setActiveTab('ROOMSTATUS')} 
                    className="text-xs font-bold text-[#7B1123] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View All Floor Grids</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>

              {/* RENDER ACTUAL ROOMS GROUPED */}
              <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-2.5 pt-1">
                {rooms.map((item) => {
                  const isAvailable = item.status === 'Available';
                  const isOccupied = item.status === 'Occupied';
                  const isCleaning = item.status === 'Cleaning';
                  const isMaintenance = item.status === 'Under Maintenance';

                  const colorClass = isAvailable
                    ? 'bg-[#E8F8EE] text-[#1B7A42] border-emerald-200'
                    : isOccupied
                    ? 'bg-[#FCE4E8] text-[#7B1123] border-rose-200'
                    : isCleaning
                    ? 'bg-[#FEF3D6] text-[#9A6B00] border-amber-300 ring-1 ring-amber-300'
                    : 'bg-[#EFE6FA] text-[#623697] border-purple-200';

                  return (
                    <button
                      key={item.roomNumber}
                      type="button"
                      onClick={() => {
                        if (isCleaning) handleMarkClean(item.roomNumber);
                        else handleToggleRoomStatus(item.roomNumber, item.status);
                      }}
                      title={isCleaning ? 'Click to mark Available' : `Room ${item.roomNumber} (${item.typeName})`}
                      className={`p-3 rounded-xl border text-center transition-all hover:scale-102 cursor-pointer shadow-2xs ${colorClass}`}
                    >
                      <div className="text-xs font-black leading-tight">#{item.roomNumber}</div>
                      <div className="text-[10px] font-semibold mt-0.5">{item.status === 'Under Maintenance' ? 'Maint' : item.status}</div>
                      {isCleaning && <div className="text-[8px] mt-0.5 text-amber-900 font-bold uppercase underline">Mark Clean</div>}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* ================= VIEW 2: RESERVATIONS / ALL BOOKINGS ================= */}
        {(activeTab === 'RESERVATIONS' || activeTab === 'CHECKIN' || activeTab === 'CHECKOUT') && (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {activeTab === 'CHECKIN' ? 'Check-In Desk' : activeTab === 'CHECKOUT' ? 'Check-Out Desk' : 'All Guest Reservations'}
                </h2>
                <p className="text-xs text-slate-500">
                  Manage guest arrivals, room assignments, check-ins, check-outs, and group booking allocations.
                </p>
              </div>

              {/* Search & Status Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-64">
                  <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name, ID, phone, or room..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#7B1123]"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-[#7B1123] font-medium"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Checked-In">Checked-In</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              {filteredBookings.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 space-y-1">
                  <ClipboardList size={32} className="mx-auto text-slate-300" />
                  <p className="font-semibold text-slate-600">No reservations matching filter criteria.</p>
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold">
                      <th className="py-2.5 px-3">Booking Ref</th>
                      <th className="py-2.5 px-3">Guest Contact</th>
                      <th className="py-2.5 px-3">Room Type & Count</th>
                      <th className="py-2.5 px-3">Assigned Room(s)</th>
                      <th className="py-2.5 px-3">Stay Dates</th>
                      <th className="py-2.5 px-3">Payment</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredBookings.map((b) => (
                      <tr key={b.bookingId} className="hover:bg-slate-50/70">
                        <td className="py-3 px-3">
                          <button
                            type="button"
                            onClick={() => setViewBookingDetails(b)}
                            className="font-bold text-[#7B1123] hover:underline cursor-pointer"
                          >
                            {b.bookingId}
                          </button>
                          <span className="text-[10px] text-slate-400 block">{b.stayTypeName || 'Standard Overnight'}</span>
                        </td>

                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-900 block">{b.customerName}</span>
                          <span className="text-[10px] text-slate-500 block">{b.customerPhone}</span>
                        </td>

                        <td className="py-3 px-3">
                          <span className="text-slate-800">{b.roomTypeName}</span>
                          <span className="text-[10px] text-slate-400 block font-semibold">
                            {b.roomsCount || 1} Room(s) • {b.numberOfGuests} Guests
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          {b.assignedRoomNumber ? (
                            <span className="font-black text-[#7B1123] bg-[#7B1123]/10 px-2 py-0.5 rounded text-[11px]">
                              {b.assignedRoomNumber}
                            </span>
                          ) : (
                            <button
                              onClick={() => handleOpenAssignModal(b)}
                              className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 hover:bg-amber-100 cursor-pointer"
                            >
                              Assign Room
                            </button>
                          )}
                        </td>

                        <td className="py-3 px-3 text-slate-500">
                          <span>{b.checkInDate} to {b.checkOutDate}</span>
                          <span className="text-[10px] text-slate-400 block">{b.numberOfNights} Night(s)</span>
                        </td>

                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-900 block">₹{(b.totalAmount || 0).toLocaleString('en-IN')}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            b.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700' :
                            b.paymentStatus === 'Refunded' ? 'bg-rose-50 text-rose-700' :
                            'bg-amber-50 text-amber-700'
                          }`}>
                            {b.paymentStatus}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            b.bookingStatus === 'Confirmed' ? 'bg-[#E8F8EE] text-[#1B7A42]' :
                            b.bookingStatus === 'Checked-In' ? 'bg-[#FEF3D6] text-[#9A6B00]' :
                            b.bookingStatus === 'Completed' ? 'bg-slate-100 text-slate-700' :
                            'bg-[#FCE4E8] text-[#7B1123]'
                          }`}>
                            {b.bookingStatus}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            
                            {/* View Details Button */}
                            <button
                              onClick={() => setViewBookingDetails(b)}
                              title="View full booking & room allocations"
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            >
                              <Eye size={15} />
                            </button>

                            {/* Check-In Action */}
                            {b.bookingStatus === 'Confirmed' && (
                              <button
                                onClick={() => handleOpenCheckInModal(b)}
                                className="px-2.5 py-1 bg-[#7B1123] text-white rounded text-[10px] font-bold hover:bg-[#600D1B] shadow-2xs transition-colors cursor-pointer"
                              >
                                Check-In
                              </button>
                            )}

                            {/* Check-Out Action */}
                            {b.bookingStatus === 'Checked-In' && (
                              <button
                                onClick={() => handleOpenCheckOutModal(b)}
                                className="px-2.5 py-1 bg-slate-900 text-white rounded text-[10px] font-bold hover:bg-black shadow-2xs transition-colors cursor-pointer"
                              >
                                Check-Out
                              </button>
                            )}

                            {/* Cancel Option */}
                            {b.bookingStatus === 'Confirmed' && (
                              <button
                                onClick={() => handleOpenCancelModal(b)}
                                title="Cancel booking according to policy"
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Ban size={14} />
                              </button>
                            )}

                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ================= VIEW 3: ROOM STATUS GRID (FLOORS & HOUSEKEEPING) ================= */}
        {activeTab === 'ROOMSTATUS' && (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Physical Rooms Inventory & Housekeeping Grid</h2>
                <p className="text-xs text-slate-500">
                  Grouped by floors. Click any room in 'Cleaning' status to mark it as 'Available'.
                </p>
              </div>

              {/* Floor Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Filter Floor:</span>
                <select
                  value={floorFilter}
                  onChange={(e) => setFloorFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-[#7B1123] font-medium"
                >
                  <option value="ALL">All Floors (Floor 1-3)</option>
                  <option value="1">Floor 1 (Standard)</option>
                  <option value="2">Floor 2 (Deluxe)</option>
                  <option value="3">Floor 3 (Premium)</option>
                </select>
              </div>
            </div>

            {/* Render Each Floor */}
            {floors.map(floorNum => {
              const floorRooms = rooms.filter(r => r.floor === floorNum);
              if (floorFilter !== 'ALL' && Number(floorFilter) !== floorNum) return null;

              return (
                <div key={floorNum} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#7B1123]" />
                      <h3 className="text-sm font-extrabold text-slate-900">
                        Floor {floorNum} • {floorNum === 1 ? 'Standard Rooms (10 Rooms)' : floorNum === 2 ? 'Deluxe Rooms (6 Rooms)' : 'Premium Rooms (4 Rooms)'}
                      </h3>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {floorRooms.filter(r => r.status === 'Available').length} Available / {floorRooms.length} Total
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-10 gap-2.5">
                    {floorRooms.map(r => {
                      const isAvail = r.status === 'Available';
                      const isOcc = r.status === 'Occupied';
                      const isClean = r.status === 'Cleaning';
                      const isMaint = r.status === 'Under Maintenance';

                      const colorClass = isAvail
                        ? 'bg-[#E8F8EE] text-[#1B7A42] border-emerald-200'
                        : isOcc
                        ? 'bg-[#FCE4E8] text-[#7B1123] border-rose-200'
                        : isClean
                        ? 'bg-[#FEF3D6] text-[#9A6B00] border-amber-300 ring-2 ring-amber-300'
                        : 'bg-[#EFE6FA] text-[#623697] border-purple-200';

                      return (
                        <button
                          key={r.roomNumber}
                          type="button"
                          onClick={() => {
                            if (isClean) handleMarkClean(r.roomNumber);
                            else handleToggleRoomStatus(r.roomNumber, r.status);
                          }}
                          className={`p-3.5 rounded-xl border text-center transition-all hover:scale-102 cursor-pointer shadow-2xs ${colorClass}`}
                        >
                          <div className="text-sm font-black">#{r.roomNumber}</div>
                          <div className="text-[10px] font-semibold mt-0.5">{r.status}</div>
                          <div className="text-[9px] text-slate-400 mt-0.5">Cap: {r.capacity || 2}</div>
                          {isClean && (
                            <div className="text-[9px] mt-1 text-amber-900 font-bold uppercase underline">
                              Mark Clean
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ================= VIEW 4: PAYMENTS ================= */}
        {activeTab === 'PAYMENTS' && (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
            <h2 className="text-base font-bold text-slate-900">Front Desk Payment Ledger</h2>
            <p className="text-xs text-slate-500">Collected room tariffs, additional charges, and transaction receipts.</p>

            <div className="overflow-x-auto">
              {bookings.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No payment records yet.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold">
                      <th className="py-2.5 px-3">Booking ID</th>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Method</th>
                      <th className="py-2.5 px-3">Tariff Subtotal</th>
                      <th className="py-2.5 px-3">Extra Charges</th>
                      <th className="py-2.5 px-3">Total Amount</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {bookings.map((b) => (
                      <tr key={b.bookingId} className="hover:bg-slate-50/70">
                        <td className="py-3 px-3 font-bold text-slate-900">{b.bookingId}</td>
                        <td className="py-3 px-3">{b.customerName}</td>
                        <td className="py-3 px-3 text-slate-500">{b.paymentMethod || 'Razorpay / Cash'}</td>
                        <td className="py-3 px-3">₹{(b.roomTotal || 0).toLocaleString('en-IN')}</td>
                        <td className="py-3 px-3 text-slate-600">
                          {b.additionalCharges ? `₹${b.additionalCharges.toLocaleString('en-IN')}` : '—'}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900">
                          ₹{(b.totalAmount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            b.paymentStatus === 'Paid' ? 'bg-[#E8F8EE] text-[#1B7A42]' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {b.paymentStatus || 'Paid'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

      </div>

      {/* ================= MODALS ================= */}

      {/* 1. Walk-In Booking Modal */}
      {isWalkInOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900">Create Walk-In Reservation</h3>
                <p className="text-xs text-slate-500">Immediate front-desk guest registration & room assignment.</p>
              </div>
              <button onClick={() => setIsWalkInOpen(false)} className="cursor-pointer">
                <X size={18} className="text-slate-400" />
              </button>
            </div>

            {walkInSuccessMsg && (
              <div className="p-3 bg-[#E8F8EE] text-[#1B7A42] border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>{walkInSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateWalkIn} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Guest Full Name *</label>
                  <input 
                    required 
                    value={wiName} 
                    onChange={(e) => setWiName(e.target.value)} 
                    placeholder="e.g. Ramesh Kumar" 
                    className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#7B1123]" 
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
                  <input 
                    required 
                    value={wiPhone} 
                    onChange={(e) => setWiPhone(e.target.value)} 
                    placeholder="+91 98844 11223" 
                    className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#7B1123]" 
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input 
                  type="email" 
                  value={wiEmail} 
                  onChange={(e) => setWiEmail(e.target.value)} 
                  placeholder="ramesh@gmail.com" 
                  className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#7B1123]" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Room Category</label>
                  <select 
                    value={wiTypeId} 
                    onChange={(e) => setWiTypeId(e.target.value)} 
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                  >
                    {roomTypes.map(rt => (
                      <option key={rt.typeId} value={rt.typeId}>{rt.name} (₹{rt.pricePerNight})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assign Physical Room #</label>
                  <select 
                    value={wiRoomNumber} 
                    onChange={(e) => setWiRoomNumber(e.target.value)} 
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="">Auto-Assign Available Room</option>
                    {rooms.filter(r => r.status === 'Available').map(r => (
                      <option key={r.roomNumber} value={r.roomNumber}>Room {r.roomNumber} (Floor {r.floor})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Check-in Date</label>
                  <input 
                    type="date" 
                    value={wiCheckIn} 
                    onChange={(e) => setWiCheckIn(e.target.value)} 
                    className="w-full p-2 border border-slate-200 rounded-lg" 
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Check-out Date</label>
                  <input 
                    type="date" 
                    value={wiCheckOut} 
                    onChange={(e) => setWiCheckOut(e.target.value)} 
                    className="w-full p-2 border border-slate-200 rounded-lg" 
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="wiInstant"
                  checked={wiInstantCheckIn}
                  onChange={(e) => setWiInstantCheckIn(e.target.checked)}
                  className="rounded text-[#7B1123]"
                />
                <label htmlFor="wiInstant" className="font-semibold text-slate-700">
                  Check-in guest immediately (Room becomes Occupied)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsWalkInOpen(false)} 
                  className="px-4 py-2 border border-slate-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submittingWalkIn} 
                  className="px-4 py-2 bg-[#7B1123] hover:bg-[#600D1B] text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {submittingWalkIn ? <Loader2 size={13} className="animate-spin" /> : null}
                  <span>Confirm Walk-in</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Check-In Modal */}
      {checkInModalBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900">Check-In Guest</h3>
                <p className="text-xs text-slate-500">Booking #{checkInModalBooking.bookingId}</p>
              </div>
              <button onClick={() => setCheckInModalBooking(null)} className="cursor-pointer">
                <X size={18} className="text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleConfirmCheckIn} className="space-y-3 text-xs">
              <div className="p-3 bg-[#F8F9FA] rounded-xl border border-slate-200 space-y-1">
                <div>Guest: <strong>{checkInModalBooking.customerName}</strong></div>
                <div>Category: <strong>{checkInModalBooking.roomTypeName}</strong></div>
                <div>Stay: <strong>{checkInModalBooking.checkInDate} to {checkInModalBooking.checkOutDate}</strong></div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Confirm Physical Room Number</label>
                <select
                  value={assignedRoomSelection}
                  onChange={(e) => setAssignedRoomSelection(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                >
                  <option value={checkInModalBooking.assignedRoomNumber || ''}>
                    {checkInModalBooking.assignedRoomNumber ? `Currently Assigned: ${checkInModalBooking.assignedRoomNumber}` : 'Select Available Room'}
                  </option>
                  {rooms.filter(r => r.status === 'Available').map(r => (
                    <option key={r.roomNumber} value={r.roomNumber}>Room {r.roomNumber} (Floor {r.floor} • {r.typeName})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setCheckInModalBooking(null)} className="px-4 py-2 border border-slate-200 rounded-lg cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#7B1123] hover:bg-[#600D1B] text-white rounded-lg font-bold cursor-pointer">Confirm Check-In</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Check-Out Modal */}
      {checkOutBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900">Check-Out & Settlement</h3>
                <p className="text-xs text-slate-500">Booking #{checkOutBooking.bookingId} • Room {checkOutBooking.assignedRoomNumber}</p>
              </div>
              <button onClick={() => setCheckOutBooking(null)} className="cursor-pointer">
                <X size={18} className="text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleConfirmCheckOut} className="space-y-3 text-xs">
              <div className="p-3 bg-[#F8F9FA] rounded-xl border border-slate-200 space-y-1">
                <div>Guest: <strong>{checkOutBooking.customerName}</strong></div>
                <div>Room Charges: <strong>₹{(checkOutBooking.totalAmount || 0).toLocaleString('en-IN')}</strong></div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Additional Charges (Minibar / Room Service)</label>
                <input
                  type="number"
                  value={extraCharges}
                  onChange={(e) => setExtraCharges(Number(e.target.value))}
                  placeholder="0"
                  className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#7B1123]"
                />
              </div>

              {extraCharges > 0 && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Charge Reason</label>
                  <input
                    value={extraDesc}
                    onChange={(e) => setExtraDesc(e.target.value)}
                    placeholder="e.g. Minibar beverages & laundry charges"
                    className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#7B1123]"
                  />
                </div>
              )}

              <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                Notice: Checking out will automatically transition Room {checkOutBooking.assignedRoomNumber} to <strong>'Cleaning'</strong> status.
              </p>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setCheckOutBooking(null)} className="px-4 py-2 border border-slate-200 rounded-lg cursor-pointer">Cancel</button>
                <button type="submit" disabled={submittingCheckOut} className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-lg font-bold cursor-pointer">
                  {submittingCheckOut ? 'Finalizing...' : 'Complete Check-Out'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Booking Details Modal */}
      {viewBookingDetails && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-[#7B1123] uppercase">Reservation Details</span>
                <h3 className="text-base font-extrabold text-slate-900">Booking #{viewBookingDetails.bookingId}</h3>
              </div>
              <button onClick={() => setViewBookingDetails(null)} className="cursor-pointer">
                <X size={18} className="text-slate-400" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              
              {/* Guest & Contact */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Guest Name</span>
                  <span className="font-bold text-slate-900">{viewBookingDetails.customerName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Contact Phone</span>
                  <span className="font-bold text-slate-900">{viewBookingDetails.customerPhone}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Email</span>
                  <span className="text-slate-700">{viewBookingDetails.customerEmail}</span>
                </div>
              </div>

              {/* Stay & Room Details */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Stay Dates</span>
                  <span className="font-bold text-slate-900">{viewBookingDetails.checkInDate} to {viewBookingDetails.checkOutDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Package & Timing</span>
                  <span className="font-bold text-slate-900">{viewBookingDetails.stayTypeName || 'Standard Overnight'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Room Category</span>
                  <span className="font-bold text-slate-900">{viewBookingDetails.roomTypeName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned Room Number(s)</span>
                  <span className="font-black text-[#7B1123]">{viewBookingDetails.assignedRoomNumber || 'Not assigned'}</span>
                </div>
              </div>

              {/* Multi-room Allocations */}
              {viewBookingDetails.roomAllocations && viewBookingDetails.roomAllocations.length > 0 && (
                <div className="space-y-2">
                  <span className="text-slate-500 font-bold uppercase text-[10px] block">Group Room Allocations ({viewBookingDetails.roomAllocations.length} Rooms)</span>
                  <div className="space-y-1.5">
                    {viewBookingDetails.roomAllocations.map((alloc, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-900">{alloc.typeName}</span>
                          <span className="text-[10px] text-slate-400 block">Floor {alloc.floor || 1} • Status: {alloc.checkInStatus}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-[#7B1123] text-white text-[10px] font-bold rounded">
                            Room {alloc.roomNumber || 'Unassigned'}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setViewBookingDetails(null);
                              handleOpenAssignModal(viewBookingDetails, alloc);
                            }}
                            className="text-[10px] text-slate-600 underline cursor-pointer"
                          >
                            Change
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Financial Breakdown */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Room Charges Subtotal:</span>
                  <span>₹{(viewBookingDetails.roomTotal || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tax (12% GST):</span>
                  <span>₹{(viewBookingDetails.tax || 0).toLocaleString('en-IN')}</span>
                </div>
                {viewBookingDetails.additionalCharges > 0 && (
                  <div className="flex justify-between text-amber-700">
                    <span>Additional Charges ({viewBookingDetails.additionalChargesDescription}):</span>
                    <span>₹{viewBookingDetails.additionalCharges.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between font-extrabold text-slate-900 pt-1 border-t border-slate-200">
                  <span>Total Amount:</span>
                  <span className="text-[#7B1123]">₹{(viewBookingDetails.totalAmount || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>

            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button 
                type="button" 
                onClick={() => setViewBookingDetails(null)} 
                className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Room Assignment Modal */}
      {assignModalBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900">Assign Physical Room</h3>
                <p className="text-xs text-slate-500">Booking #{assignModalBooking.bookingId}</p>
              </div>
              <button onClick={() => setAssignModalBooking(null)} className="cursor-pointer">
                <X size={18} className="text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleConfirmRoomAssignment} className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div>Guest: <strong>{assignModalBooking.customerName}</strong></div>
                <div>Category: <strong>{assignModalBooking.roomTypeName}</strong></div>
                <div>Dates: <strong>{assignModalBooking.checkInDate} to {assignModalBooking.checkOutDate}</strong></div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Available Room</label>
                <select
                  value={selectedRoomToAssign}
                  onChange={(e) => setSelectedRoomToAssign(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                  required
                >
                  <option value="">Choose physical room...</option>
                  {rooms.filter(r => r.status === 'Available').map(r => (
                    <option key={r.roomNumber} value={r.roomNumber}>
                      Room {r.roomNumber} (Floor {r.floor} • {r.typeName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setAssignModalBooking(null)} className="px-4 py-2 border border-slate-200 rounded-lg cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#7B1123] text-white rounded-lg font-bold cursor-pointer">Save Assignment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Cancellation Modal */}
      {cancelModalBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-rose-700">Cancel Reservation</h3>
                <p className="text-xs text-slate-500">Booking #{cancelModalBooking.bookingId}</p>
              </div>
              <button onClick={() => setCancelModalBooking(null)} className="cursor-pointer">
                <X size={18} className="text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleConfirmCancel} className="space-y-3 text-xs">
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-900 space-y-1">
                <div>Guest: <strong>{cancelModalBooking.customerName}</strong></div>
                <div>Amount: <strong>₹{(cancelModalBooking.totalAmount || 0).toLocaleString('en-IN')}</strong></div>
                <p className="text-[11px] text-rose-700 mt-1">
                  Cancelling will release Room {cancelModalBooking.assignedRoomNumber || 'Reserved'} and mark payment as Refunded.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason for Cancellation</label>
                <input
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Guest travel emergency, front desk request"
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setCancelModalBooking(null)} className="px-4 py-2 border border-slate-200 rounded-lg cursor-pointer">Back</button>
                <button type="submit" disabled={submittingCancel} className="px-4 py-2 bg-rose-700 text-white rounded-lg font-bold cursor-pointer">
                  {submittingCancel ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </PortalShell>
  );
};

export default ReceptionistDashboard;
