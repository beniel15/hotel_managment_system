import React, { useState, useEffect } from 'react';
import { 
  getManagerAnalytics, 
  getAllBookings, 
  getPhysicalRooms, 
  getRoomTypes,
  createRoomType, 
  createPhysicalRoom, 
  updateRoomStatus,
  getStaffList, 
  createStaffAccount, 
  toggleStaffStatus,
  getMaintenanceLogs, 
  scheduleMaintenance, 
  completeMaintenance,
  cancelBooking 
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PortalShell from '../../components/PortalShell';
import { 
  Building2, 
  BedDouble, 
  Users, 
  Plus, 
  Loader2,
  Trash2,
  CheckCircle2,
  UserCheck,
  X,
  Wrench,
  Calendar,
  Search,
  FileText,
  LayoutDashboard,
  CreditCard,
  ClipboardList,
  UserCog,
  ChevronDown,
  LogIn,
  LogOut,
  IndianRupee
} from 'lucide-react';

const OwnerDashboard = () => {
  const { currentUser } = useAuth();

  // Primary Data State
  const [metrics, setMetrics] = useState(null);
  const [charts, setCharts] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [staff, setStaff] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Management Tab: 'DASHBOARD', 'BOOKINGS', 'ROOMS', 'AVAILABILITY', 'PAYMENTS', 'MAINTENANCE', 'STAFF', 'REPORTS'
  const [activeTab, setActiveTab] = useState('DASHBOARD');

  // Modals
  const [isAddTypeOpen, setIsAddTypeOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeDesc, setNewTypeDesc] = useState('');
  const [newTypeOccupancy, setNewTypeOccupancy] = useState(2);
  const [newTypePrice, setNewTypePrice] = useState(3000);
  const [newTypeAmenities, setNewTypeAmenities] = useState('Central AC, King Bed, Smart TV, Wi-Fi');
  const [newTypeImage, setNewTypeImage] = useState('https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80');

  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newRoomFloor, setNewRoomFloor] = useState(1);
  const [newRoomTypeId, setNewRoomTypeId] = useState('');

  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('Reception@123');
  const [staffPhone, setStaffPhone] = useState('+91 98844 55667');
  const [staffShift, setStaffShift] = useState('Morning');

  const [isMaintenanceOpen, setIsMaintenanceOpen] = useState(false);
  const [mntRoomNumber, setMntRoomNumber] = useState('');
  const [mntIssue, setMntIssue] = useState('');
  const [mntSeverity, setMntSeverity] = useState('Medium');

  const [bookingSearch, setBookingSearch] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [anRes, bkRes, rmRes, tpRes, stRes, mnRes] = await Promise.allSettled([
        getManagerAnalytics(),
        getAllBookings(),
        getPhysicalRooms(),
        getRoomTypes(),
        getStaffList(),
        getMaintenanceLogs()
      ]);

      if (anRes.status === 'fulfilled' && anRes.value.data?.success) {
        setMetrics(anRes.value.data.metrics);
        setCharts(anRes.value.data.charts);
      }
      if (bkRes.status === 'fulfilled' && bkRes.value.data?.bookings) {
        setBookings(bkRes.value.data.bookings);
      } else {
        setBookings([]);
      }
      if (rmRes.status === 'fulfilled' && rmRes.value.data?.rooms) {
        setRooms(rmRes.value.data.rooms);
      } else {
        setRooms([]);
      }
      if (tpRes.status === 'fulfilled' && tpRes.value.data?.roomTypes) {
        setRoomTypes(tpRes.value.data.roomTypes);
        if (!newRoomTypeId && tpRes.value.data.roomTypes.length > 0) {
          setNewRoomTypeId(tpRes.value.data.roomTypes[0].typeId);
        }
      } else {
        setRoomTypes([]);
      }
      if (stRes.status === 'fulfilled' && stRes.value.data?.staff) {
        setStaff(stRes.value.data.staff);
      } else {
        setStaff([]);
      }
      if (mnRes.status === 'fulfilled' && mnRes.value.data?.maintenance) {
        setMaintenance(mnRes.value.data.maintenance);
      } else {
        setMaintenance([]);
      }
    } catch (err) {
      console.warn('Manager dashboard load notice:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCreateRoomType = async (e) => {
    e.preventDefault();
    try {
      const amenitiesArr = newTypeAmenities.split(',').map(s => s.trim()).filter(Boolean);
      await createRoomType({
        name: newTypeName,
        description: newTypeDesc,
        occupancy: Number(newTypeOccupancy),
        pricePerNight: Number(newTypePrice),
        amenities: amenitiesArr,
        images: [newTypeImage]
      });
      setIsAddTypeOpen(false);
      setNewTypeName('');
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not create room type.');
    }
  };

  const handleCreatePhysicalRoom = async (e) => {
    e.preventDefault();
    try {
      await createPhysicalRoom({
        roomNumber: newRoomNumber,
        floor: Number(newRoomFloor),
        typeId: newRoomTypeId
      });
      setIsAddRoomOpen(false);
      setNewRoomNumber('');
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not create physical room.');
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      await createStaffAccount({
        name: staffName,
        email: staffEmail,
        password: staffPassword,
        phone: staffPhone,
        shift: staffShift
      });
      setIsAddStaffOpen(false);
      setStaffName('');
      setStaffEmail('');
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not create staff account.');
    }
  };

  const handleToggleStaff = async (userId, currentStatus) => {
    try {
      await toggleStaffStatus(userId, !currentStatus);
      setStaff(prev => prev.map(s => s.userId === userId ? { ...s, isActive: !currentStatus } : s));
    } catch (err) {
      alert('Could not update staff status.');
    }
  };

  const handleScheduleMaintenance = async (e) => {
    e.preventDefault();
    try {
      await scheduleMaintenance({
        roomNumber: mntRoomNumber,
        issueDescription: mntIssue,
        severity: mntSeverity
      });
      setIsMaintenanceOpen(false);
      setMntIssue('');
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not place room in maintenance.');
    }
  };

  const handleCompleteMaintenance = async (maintenanceId) => {
    const notes = prompt('Enter resolution notes:', 'Servicing and inspection completed.');
    if (notes === null) return;
    try {
      await completeMaintenance(maintenanceId, notes);
      fetchDashboardData();
    } catch (err) {
      alert('Could not complete maintenance.');
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm(`Cancel booking #${bookingId} and initiate refund?`)) return;
    try {
      await cancelBooking(bookingId, 'Cancelled by General Manager');
      fetchDashboardData();
    } catch (err) {
      alert('Could not cancel booking.');
    }
  };

  const filteredBookings = bookings.filter(b => {
    const term = bookingSearch.toLowerCase().trim();
    return !term || 
      b.customerName?.toLowerCase().includes(term) ||
      b.bookingId?.toLowerCase().includes(term) ||
      b.roomTypeName?.toLowerCase().includes(term) ||
      b.assignedRoomNumber?.toLowerCase().includes(term);
  });

  // REAL METRICS CALCULATED FROM ACTUAL DATABASE RECORDS (NO DUMMY VALUES)
  const totalRoomsVal = rooms.length;
  const occupiedVal = rooms.filter(r => r.status === 'Occupied').length;
  const availableVal = rooms.filter(r => r.status === 'Available').length;
  const maintenanceVal = rooms.filter(r => r.status === 'Maintenance').length;
  const totalBookingsVal = bookings.length;
  const totalRevenueVal = bookings
    .filter(b => b.paymentStatus === 'Paid')
    .reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayArrivalsVal = bookings.filter(b => b.checkInDate?.split('T')[0] === todayStr).length;
  const todayDeparturesVal = bookings.filter(b => b.checkOutDate?.split('T')[0] === todayStr).length;

  const occupancyPercent = totalRoomsVal > 0 ? Math.round((occupiedVal / totalRoomsVal) * 100) : 0;
  const availablePercent = totalRoomsVal > 0 ? Math.round((availableVal / totalRoomsVal) * 100) : 0;
  const maintenancePercent = totalRoomsVal > 0 ? Math.round((maintenanceVal / totalRoomsVal) * 100) : 0;

  // Donut SVG circumference math (r = 50 -> C = 314.16)
  const C = 314.16;
  const occupiedStroke = (occupancyPercent / 100) * C;
  const availableStroke = (availablePercent / 100) * C;
  const maintenanceStroke = (maintenancePercent / 100) * C;

  return (
    <PortalShell
      brandSubtitle="Management Portal"
      headerTitle="Manager Dashboard"
      headerRight={
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs">
            <span>Live Data</span>
          </div>
        </div>
      }
      navItems={[
        { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard, active: activeTab === 'DASHBOARD', onClick: () => setActiveTab('DASHBOARD') },
        { id: 'BOOKINGS', label: 'Bookings', icon: ClipboardList, active: activeTab === 'BOOKINGS', onClick: () => setActiveTab('BOOKINGS') },
        { id: 'ROOMS', label: 'Rooms & Types', icon: BedDouble, active: activeTab === 'ROOMS', onClick: () => setActiveTab('ROOMS') },
        { id: 'AVAILABILITY', label: 'Availability', icon: Calendar, active: activeTab === 'AVAILABILITY', onClick: () => setActiveTab('AVAILABILITY') },
        { id: 'PAYMENTS', label: 'Payments', icon: CreditCard, active: activeTab === 'PAYMENTS', onClick: () => setActiveTab('PAYMENTS') },
        { id: 'MAINTENANCE', label: 'Maintenance', icon: Wrench, active: activeTab === 'MAINTENANCE', onClick: () => setActiveTab('MAINTENANCE') },
        { id: 'STAFF', label: 'Staff (Receptionist)', icon: UserCog, active: activeTab === 'STAFF', onClick: () => setActiveTab('STAFF') },
        { id: 'REPORTS', label: 'Reports', icon: FileText, active: activeTab === 'REPORTS', onClick: () => setActiveTab('REPORTS') }
      ]}
    >
      <div className="space-y-6">

        {/* ================= VIEW 1: DASHBOARD OVERVIEW ================= */}
        {activeTab === 'DASHBOARD' && (
          <div className="space-y-6">
            
            {/* 8 TOP METRIC CARDS (REAL DATABASE COUNTS) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Card 1: Total Rooms */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 block">Total Rooms</span>
                  <div className="text-2xl font-bold text-slate-900 mt-1">{totalRoomsVal}</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center shrink-0">
                  <BedDouble size={20} />
                </div>
              </div>

              {/* Card 2: Occupied */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 block">Occupied</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl font-bold text-slate-900">{occupiedVal}</span>
                    <span className="bg-[#E8F8EE] text-[#1B7A42] text-[11px] font-bold px-2 py-0.5 rounded-full">
                      {occupancyPercent}%
                    </span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <BedDouble size={20} />
                </div>
              </div>

              {/* Card 3: Available */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 block">Available</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl font-bold text-slate-900">{availableVal}</span>
                    <span className="bg-[#E8F8EE] text-[#1B7A42] text-[11px] font-bold px-2 py-0.5 rounded-full">
                      {availablePercent}%
                    </span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <BedDouble size={20} />
                </div>
              </div>

              {/* Card 4: Maintenance */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 block">Maintenance</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl font-bold text-slate-900">{maintenanceVal}</span>
                    <span className="bg-[#FEF3D6] text-[#9A6B00] text-[11px] font-bold px-2 py-0.5 rounded-full">
                      {maintenancePercent}%
                    </span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Wrench size={19} />
                </div>
              </div>

              {/* Card 5: Total Bookings */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 block">Total Bookings</span>
                  <div className="text-2xl font-bold text-slate-900 mt-1">{totalBookingsVal}</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#7B1123] flex items-center justify-center shrink-0">
                  <Calendar size={19} />
                </div>
              </div>

              {/* Card 6: Total Revenue */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 block">Total Revenue</span>
                  <div className="text-2xl font-bold text-slate-900 mt-1">
                    ₹{totalRevenueVal.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#7B1123] flex items-center justify-center shrink-0">
                  <IndianRupee size={20} />
                </div>
              </div>

              {/* Card 7: Today's Arrivals */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 block">Today's Arrivals</span>
                  <div className="text-2xl font-bold text-slate-900 mt-1">{todayArrivalsVal}</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center shrink-0">
                  <LogIn size={20} />
                </div>
              </div>

              {/* Card 8: Today's Departures */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 block">Today's Departures</span>
                  <div className="text-2xl font-bold text-slate-900 mt-1">{todayDeparturesVal}</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center shrink-0">
                  <LogOut size={20} />
                </div>
              </div>

            </div>

            {/* 2 CHARTS SIDE BY SIDE (COMPUTED LIVE) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Left Chart: Real Room Occupancy Donut */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">Room Occupancy</h3>

                <div className="flex flex-col sm:flex-row items-center justify-around gap-6 pt-2">
                  {/* SVG Donut */}
                  <div className="relative w-44 h-44 shrink-0">
                    <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
                      {/* Background track */}
                      <circle
                        cx="70"
                        cy="70"
                        r="50"
                        fill="none"
                        stroke="#F1F5F9"
                        strokeWidth="16"
                      />
                      {totalRoomsVal > 0 && (
                        <>
                          {/* Segment 1: Occupied */}
                          <circle
                            cx="70"
                            cy="70"
                            r="50"
                            fill="none"
                            stroke="#7B1123"
                            strokeWidth="16"
                            strokeDasharray={`${occupiedStroke} ${C}`}
                            strokeDashoffset="0"
                            strokeLinecap="round"
                          />
                          {/* Segment 2: Available */}
                          <circle
                            cx="70"
                            cy="70"
                            r="50"
                            fill="none"
                            stroke="#2DD4BF"
                            strokeWidth="16"
                            strokeDasharray={`${availableStroke} ${C}`}
                            strokeDashoffset={`-${occupiedStroke}`}
                            strokeLinecap="round"
                          />
                          {/* Segment 3: Maintenance */}
                          <circle
                            cx="70"
                            cy="70"
                            r="50"
                            fill="none"
                            stroke="#FB7185"
                            strokeWidth="16"
                            strokeDasharray={`${maintenanceStroke} ${C}`}
                            strokeDashoffset={`-${occupiedStroke + availableStroke}`}
                            strokeLinecap="round"
                          />
                        </>
                      )}
                    </svg>

                    {/* Donut Center Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-extrabold text-slate-900 leading-none">
                        {occupancyPercent}%
                      </span>
                      <span className="text-xs font-semibold text-slate-400 mt-1">Occupied</span>
                    </div>
                  </div>

                  {/* Legend list */}
                  <div className="space-y-3 text-xs font-semibold">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full bg-[#7B1123]" />
                      <span className="text-slate-700">Occupied ({occupiedVal})</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full bg-[#2DD4BF]" />
                      <span className="text-slate-700">Available ({availableVal})</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full bg-[#FB7185]" />
                      <span className="text-slate-700">Maintenance ({maintenanceVal})</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Chart: Real Revenue Trend Spline */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">Revenue Summary</h3>
                  <span className="text-xs font-bold text-[#7B1123]">
                    Total: ₹{totalRevenueVal.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="pt-2">
                  <div className="h-44 flex items-end justify-between gap-3 pt-6 pb-2 border-b border-slate-200 px-2">
                    {(charts?.dailyRevenue?.length > 0 ? charts.dailyRevenue : [
                      { label: 'Mon', revenue: 0 },
                      { label: 'Tue', revenue: 0 },
                      { label: 'Wed', revenue: 0 },
                      { label: 'Thu', revenue: 0 },
                      { label: 'Fri', revenue: 0 },
                      { label: 'Sat', revenue: 0 },
                      { label: 'Sun', revenue: totalRevenueVal }
                    ]).map((day, idx) => {
                      const maxR = Math.max(...(charts?.dailyRevenue?.map(d => d.revenue) || [1000]), totalRevenueVal || 1000);
                      const heightPercent = totalRevenueVal > 0 ? Math.max(12, Math.round((day.revenue / maxR) * 100)) : 10;

                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                          <span className="text-[9px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            ₹{day.revenue.toLocaleString('en-IN')}
                          </span>
                          <div 
                            style={{ height: `${heightPercent}%` }}
                            className="w-full max-w-[36px] bg-[#7B1123] rounded-t-md transition-all group-hover:bg-[#600D1B]"
                          />
                          <span className="text-[10px] font-semibold text-slate-500">
                            {day.label?.split(',')?.[0] || `D${idx + 1}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ================= VIEW 2: BOOKINGS MANAGEMENT ================= */}
        {activeTab === 'BOOKINGS' && (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">All Guest Reservations</h2>
                <p className="text-xs text-slate-500">Search by Booking ID, customer name, or assigned room number.</p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search reservations..."
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#7B1123]"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              {filteredBookings.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No reservations found in the database.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold">
                      <th className="py-2.5 px-3">Booking ID</th>
                      <th className="py-2.5 px-3">Guest Name</th>
                      <th className="py-2.5 px-3">Room Type</th>
                      <th className="py-2.5 px-3">Room #</th>
                      <th className="py-2.5 px-3">Dates</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredBookings.map((b) => (
                      <tr key={b.bookingId} className="hover:bg-slate-50/80">
                        <td className="py-3 px-3 font-bold text-slate-900">{b.bookingId}</td>
                        <td className="py-3 px-3">{b.customerName}</td>
                        <td className="py-3 px-3">{b.roomTypeName}</td>
                        <td className="py-3 px-3 font-semibold text-[#7B1123]">{b.assignedRoomNumber || 'Pending'}</td>
                        <td className="py-3 px-3 text-slate-500">{b.checkInDate?.split('T')[0]} to {b.checkOutDate?.split('T')[0]}</td>
                        <td className="py-3 px-3 font-bold">₹{(b.totalAmount || 0).toLocaleString('en-IN')}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            b.bookingStatus === 'Confirmed' ? 'bg-[#E8F8EE] text-[#1B7A42]' :
                            b.bookingStatus === 'Checked-In' ? 'bg-[#FEF3D6] text-[#9A6B00]' :
                            b.bookingStatus === 'Completed' ? 'bg-slate-100 text-slate-700' :
                            'bg-[#FCE4E8] text-[#7B1123]'
                          }`}>
                            {b.bookingStatus}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          {b.bookingStatus !== 'Cancelled' && b.bookingStatus !== 'Completed' && (
                            <button
                              onClick={() => handleCancelBooking(b.bookingId)}
                              className="px-2.5 py-1 rounded bg-[#FCE4E8] text-[#7B1123] text-[10px] font-bold hover:bg-rose-100"
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ================= VIEW 3: ROOMS & TYPES ================= */}
        {activeTab === 'ROOMS' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold text-slate-900">Room Categories & Pricing</h2>
                <p className="text-xs text-slate-500">Configure room types, rates, capacity, and amenities.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsAddRoomOpen(true)}
                  className="px-3.5 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-black"
                >
                  + Add Room Number
                </button>
                <button
                  onClick={() => setIsAddTypeOpen(true)}
                  className="px-3.5 py-2 bg-[#7B1123] text-white rounded-xl text-xs font-semibold hover:bg-[#600D1B]"
                >
                  + Add Room Type
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {roomTypes.map((rt) => (
                <div key={rt.typeId} className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-3 shadow-2xs">
                  <img src={rt.images?.[0]} alt={rt.name} className="w-full h-36 object-cover rounded-xl" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{rt.name}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{rt.description}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Price / night</span>
                      <span className="text-sm font-bold text-slate-900">₹{(rt.pricePerNight || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-semibold text-slate-600">
                      {rt.occupancy} Guests
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Physical Rooms */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Physical Rooms Directory</h3>
              {rooms.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No rooms added yet. Click "+ Add Room Number" to register rooms.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-8 gap-2.5">
                  {rooms.map((r) => (
                    <div key={r.roomNumber} className="p-3 bg-[#F8F9FA] border border-slate-200 rounded-xl text-center">
                      <div className="text-sm font-bold text-slate-900">{r.roomNumber}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Floor {r.floor}</div>
                      <span className={`inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        r.status === 'Available' ? 'bg-[#E8F8EE] text-[#1B7A42]' :
                        r.status === 'Occupied' ? 'bg-[#FCE4E8] text-[#7B1123]' :
                        r.status === 'Cleaning' ? 'bg-[#FEF3D6] text-[#9A6B00]' :
                        'bg-[#EFE6FA] text-[#623697]'
                      }`}>
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= VIEW 4: AVAILABILITY ================= */}
        {activeTab === 'AVAILABILITY' && (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
            <h2 className="text-base font-bold text-slate-900">Real-Time Inventory & Room Grid</h2>
            <p className="text-xs text-slate-500">Live operational room statuses across all chambers.</p>

            {rooms.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No physical rooms registered yet.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-2">
                {rooms.map((r) => (
                  <div 
                    key={r.roomNumber} 
                    className={`p-3.5 rounded-xl border text-center ${
                      r.status === 'Available' ? 'bg-[#E8F8EE] border-emerald-200 text-[#1B7A42]' :
                      r.status === 'Occupied' ? 'bg-[#FCE4E8] border-rose-200 text-[#7B1123]' :
                      r.status === 'Cleaning' ? 'bg-[#FEF3D6] border-amber-200 text-[#9A6B00]' :
                      'bg-[#EFE6FA] border-purple-200 text-[#623697]'
                    }`}
                  >
                    <div className="text-sm font-extrabold">{r.roomNumber}</div>
                    <div className="text-[10px] font-semibold mt-0.5">{r.status}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= VIEW 5: PAYMENTS ================= */}
        {activeTab === 'PAYMENTS' && (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold text-slate-900">Financial Records & Payment Audit</h2>
                <p className="text-xs text-slate-500">Transaction history and settled revenues.</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500">Settled Revenue</span>
                <div className="text-xl font-bold text-[#7B1123]">₹{totalRevenueVal.toLocaleString('en-IN')}</div>
              </div>
            </div>

            <div className="overflow-x-auto">
              {bookings.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No payment records found.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold">
                      <th className="py-2.5 px-3">Booking ID</th>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Method</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bookings.map((b) => (
                      <tr key={b.bookingId} className="hover:bg-slate-50/80">
                        <td className="py-3 px-3 font-bold text-slate-900">{b.bookingId}</td>
                        <td className="py-3 px-3">{b.customerName}</td>
                        <td className="py-3 px-3 text-slate-500">{b.paymentMethod || 'Online'}</td>
                        <td className="py-3 px-3 font-bold">₹{(b.totalAmount || 0).toLocaleString('en-IN')}</td>
                        <td className="py-3 px-3">
                          <span className="bg-[#E8F8EE] text-[#1B7A42] text-[10px] font-bold px-2 py-0.5 rounded-full">
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

        {/* ================= VIEW 6: MAINTENANCE ================= */}
        {activeTab === 'MAINTENANCE' && (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold text-slate-900">Room Maintenance & Service Logs</h2>
                <p className="text-xs text-slate-500">Prevent booking collisions by blocking rooms under repair.</p>
              </div>
              <button
                onClick={() => setIsMaintenanceOpen(true)}
                className="px-3.5 py-2 bg-[#7B1123] text-white rounded-xl text-xs font-semibold hover:bg-[#600D1B]"
              >
                + Schedule Room Repair
              </button>
            </div>

            <div className="overflow-x-auto">
              {maintenance.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No active maintenance tickets.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold">
                      <th className="py-2.5 px-3">Room #</th>
                      <th className="py-2.5 px-3">Issue Description</th>
                      <th className="py-2.5 px-3">Severity</th>
                      <th className="py-2.5 px-3">Scheduled</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {maintenance.map((m) => (
                      <tr key={m.maintenanceId || m._id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-3 font-bold text-[#7B1123]">{m.roomNumber}</td>
                        <td className="py-3 px-3">{m.issueDescription}</td>
                        <td className="py-3 px-3 font-semibold">{m.severity}</td>
                        <td className="py-3 px-3 text-slate-400">{m.startDate?.split('T')[0]}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            m.status === 'Completed' ? 'bg-[#E8F8EE] text-[#1B7A42]' : 'bg-[#FEF3D6] text-[#9A6B00]'
                          }`}>
                            {m.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          {m.status !== 'Completed' && (
                            <button
                              onClick={() => handleCompleteMaintenance(m.maintenanceId || m._id)}
                              className="px-2.5 py-1 bg-[#E8F8EE] text-[#1B7A42] rounded text-[10px] font-bold hover:bg-emerald-100"
                            >
                              Mark Fixed
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ================= VIEW 7: STAFF MANAGEMENT ================= */}
        {activeTab === 'STAFF' && (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold text-slate-900">Front Desk Receptionist Staff</h2>
                <p className="text-xs text-slate-500">Create staff logins and manage operational access permissions.</p>
              </div>
              <button
                onClick={() => setIsAddStaffOpen(true)}
                className="px-3.5 py-2 bg-[#7B1123] text-white rounded-xl text-xs font-semibold hover:bg-[#600D1B]"
              >
                + Create Receptionist
              </button>
            </div>

            <div className="overflow-x-auto">
              {staff.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No staff accounts registered. Click "+ Create Receptionist" to add staff.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold">
                      <th className="py-2.5 px-3">Name</th>
                      <th className="py-2.5 px-3">Email</th>
                      <th className="py-2.5 px-3">Phone</th>
                      <th className="py-2.5 px-3">Shift</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {staff.map((s) => (
                      <tr key={s.userId} className="hover:bg-slate-50/80">
                        <td className="py-3 px-3 font-bold text-slate-900">{s.name}</td>
                        <td className="py-3 px-3">{s.email}</td>
                        <td className="py-3 px-3 text-slate-500">{s.phone}</td>
                        <td className="py-3 px-3">{s.shift || 'General'}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            s.isActive ? 'bg-[#E8F8EE] text-[#1B7A42]' : 'bg-[#FCE4E8] text-[#7B1123]'
                          }`}>
                            {s.isActive ? 'Active' : 'Deactivated'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => handleToggleStaff(s.userId, s.isActive)}
                            className="px-2.5 py-1 rounded border border-slate-300 text-[10px] font-bold hover:bg-slate-50"
                          >
                            {s.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ================= VIEW 8: REPORTS ================= */}
        {activeTab === 'REPORTS' && (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
            <h2 className="text-base font-bold text-slate-900">Hotel Operational Reports</h2>
            <p className="text-xs text-slate-500">Summary reports generated from verified database records.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl border border-slate-200 bg-[#F8F9FA] space-y-1">
                <span className="text-xs text-slate-500 font-semibold">Total Revenue</span>
                <div className="text-xl font-bold text-[#7B1123]">₹{totalRevenueVal.toLocaleString('en-IN')}</div>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-[#F8F9FA] space-y-1">
                <span className="text-xs text-slate-500 font-semibold">Total Bookings Recorded</span>
                <div className="text-xl font-bold text-slate-900">{totalBookingsVal}</div>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-[#F8F9FA] space-y-1">
                <span className="text-xs text-slate-500 font-semibold">Live Occupancy Rate</span>
                <div className="text-xl font-bold text-[#1B7A42]">{occupancyPercent}%</div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ================= MODALS ================= */}
      {/* 1. Add Room Type Modal */}
      {isAddTypeOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">Add Room Category</h3>
              <button onClick={() => setIsAddTypeOpen(false)}><X size={18} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateRoomType} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category Name</label>
                <input required value={newTypeName} onChange={(e) => setNewTypeName(e.target.value)} placeholder="e.g. Royal Suite" className="w-full p-2 border rounded-lg" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nightly Price (₹)</label>
                <input required type="number" value={newTypePrice} onChange={(e) => setNewTypePrice(e.target.value)} className="w-full p-2 border rounded-lg" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Max Guests Occupancy</label>
                <input required type="number" value={newTypeOccupancy} onChange={(e) => setNewTypeOccupancy(e.target.value)} className="w-full p-2 border rounded-lg" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea rows={2} value={newTypeDesc} onChange={(e) => setNewTypeDesc(e.target.value)} placeholder="Amenities and suite features" className="w-full p-2 border rounded-lg" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsAddTypeOpen(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#7B1123] text-white rounded-lg font-bold">Create Category</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Add Physical Room Modal */}
      {isAddRoomOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">Add Physical Room Unit</h3>
              <button onClick={() => setIsAddRoomOpen(false)}><X size={18} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreatePhysicalRoom} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Room Number</label>
                <input required value={newRoomNumber} onChange={(e) => setNewRoomNumber(e.target.value)} placeholder="e.g. 105" className="w-full p-2 border rounded-lg" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Floor Level</label>
                <input required type="number" value={newRoomFloor} onChange={(e) => setNewRoomFloor(e.target.value)} className="w-full p-2 border rounded-lg" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assign Room Category</label>
                <select value={newRoomTypeId} onChange={(e) => setNewRoomTypeId(e.target.value)} className="w-full p-2 border rounded-lg">
                  {roomTypes.map(rt => <option key={rt.typeId} value={rt.typeId}>{rt.name}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsAddRoomOpen(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#7B1123] text-white rounded-lg font-bold">Register Room</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Add Staff Modal */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">Create Receptionist Staff</h3>
              <button onClick={() => setIsAddStaffOpen(false)}><X size={18} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateStaff} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input required value={staffName} onChange={(e) => setStaffName(e.target.value)} placeholder="e.g. Priya Sharma" className="w-full p-2 border rounded-lg" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Staff Email</label>
                <input required type="email" value={staffEmail} onChange={(e) => setStaffEmail(e.target.value)} placeholder="priya@hotelsaravana.com" className="w-full p-2 border rounded-lg" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Initial Password</label>
                <input required value={staffPassword} onChange={(e) => setStaffPassword(e.target.value)} className="w-full p-2 border rounded-lg" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Shift</label>
                <select value={staffShift} onChange={(e) => setStaffShift(e.target.value)} className="w-full p-2 border rounded-lg">
                  <option value="Morning">Morning Shift (7 AM - 3 PM)</option>
                  <option value="Evening">Evening Shift (3 PM - 11 PM)</option>
                  <option value="Night">Night Shift (11 PM - 7 AM)</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsAddStaffOpen(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#7B1123] text-white rounded-lg font-bold">Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Schedule Maintenance Modal */}
      {isMaintenanceOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">Schedule Room Maintenance</h3>
              <button onClick={() => setIsMaintenanceOpen(false)}><X size={18} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleScheduleMaintenance} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Room Number</label>
                {rooms && rooms.length > 0 ? (
                  <select 
                    required 
                    value={mntRoomNumber} 
                    onChange={(e) => setMntRoomNumber(e.target.value)} 
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="">Select Room...</option>
                    {rooms.map(r => (
                      <option key={r.roomNumber} value={r.roomNumber}>
                        Room {r.roomNumber} (Floor {r.floor} • {r.typeName} • Currently: {r.status})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input required value={mntRoomNumber} onChange={(e) => setMntRoomNumber(e.target.value)} placeholder="e.g. 108" className="w-full p-2 border rounded-lg" />
                )}
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Issue Description</label>
                <textarea required rows={2} value={mntIssue} onChange={(e) => setMntIssue(e.target.value)} placeholder="e.g. AC cooling unit servicing and electrical inspection" className="w-full p-2 border rounded-lg" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Severity</label>
                <select value={mntSeverity} onChange={(e) => setMntSeverity(e.target.value)} className="w-full p-2 border rounded-lg">
                  <option value="Low">Low (Minor upkeep)</option>
                  <option value="Medium">Medium (HVAC / Plumbing)</option>
                  <option value="Critical">Critical (Immediate shutdown)</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsMaintenanceOpen(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#7B1123] text-white rounded-lg font-bold">Schedule Repair</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PortalShell>
  );
};

export default OwnerDashboard;
