import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getHotelProfile, checkRoomAvailability, getRoomTypes } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Building2, 
  Calendar, 
  CreditCard, 
  User, 
  Mail, 
  Phone, 
  ArrowLeft, 
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Clock,
  Sparkles,
  Loader2,
  Users,
  BedDouble,
  ChevronRight,
  Plus,
  Minus,
  Check,
  Info,
  SlidersHorizontal,
  Search
} from 'lucide-react';

const STAY_PACKAGES = [
  {
    id: 'standard_overnight',
    name: 'Standard Overnight',
    timing: 'Check-in 12:00 PM • Check-out 11:00 AM',
    checkInTime: '12:00 PM',
    checkOutTime: '11:00 AM',
    desc: 'Classic hotel stay with overnight comfort, complimentary morning tea and full amenities.'
  },
  {
    id: 'day_stay',
    name: 'Day Stay',
    timing: '10:00 AM to 8:00 PM',
    checkInTime: '10:00 AM',
    checkOutTime: '08:00 PM',
    desc: 'Ideal for daytime business work, quick transit freshen-up, and city stopovers.'
  },
  {
    id: 'full_24h',
    name: 'Full 24-Hour Stay',
    timing: 'Flexible 24-Hour Duration',
    checkInTime: '12:00 PM',
    checkOutTime: '12:00 PM Next Day',
    desc: 'Complete 24-hour flexibility from check-in time with seamless extended checkout.'
  }
];

const RoomBooking = () => {
  const { roomId, typeId } = useParams();
  const targetTypeId = typeId || roomId;
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();

  // Initial State from URL / Navigation
  const stateRoomType = location.state?.roomType;
  const stateCheckIn = location.state?.checkInDate;
  const stateCheckOut = location.state?.checkOutDate;
  const stateGuests = location.state?.guests;

  const [hotel, setHotel] = useState(null);
  const [availableRoomTypes, setAvailableRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Date Calculation Helpers
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const getTomorrowStr = (daysAhead = 1) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString().split('T')[0];
  };

  // Search Criteria State
  const [checkInDate, setCheckInDate] = useState(() => stateCheckIn || getTodayStr());
  const [checkOutDate, setCheckOutDate] = useState(() => stateCheckOut || getTomorrowStr(2));
  const [stayPackage, setStayPackage] = useState('standard_overnight');
  const [adultsCount, setAdultsCount] = useState(2);
  const [childrenCount, setChildrenCount] = useState(0);
  const [roomsRequired, setRoomsRequired] = useState(1);
  const [preferredFloor, setPreferredFloor] = useState('any');
  const [floorBreakdown, setFloorBreakdown] = useState(null);
  const [floorStatus, setFloorStatus] = useState(null);

  // Selected Rooms Cart: { [typeId]: quantity }
  const [selectedRoomsCart, setSelectedRoomsCart] = useState({});

  // Guest Contact Form
  const [guestName, setGuestName] = useState(currentUser?.name || currentUser?.displayName || '');
  const [guestEmail, setGuestEmail] = useState(currentUser?.email || '');
  const [guestPhone, setGuestPhone] = useState(currentUser?.phone || '+91 98765 43210');
  const [specialRequests, setSpecialRequests] = useState('');

  const currentPackageInfo = STAY_PACKAGES.find(p => p.id === stayPackage) || STAY_PACKAGES[0];

  // Fetch Hotel & Initial Availability
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const [hRes, aRes] = await Promise.allSettled([
          getHotelProfile(),
          checkRoomAvailability(checkInDate, checkOutDate, adultsCount + childrenCount, stayPackage, roomsRequired, preferredFloor)
        ]);

        if (hRes.status === 'fulfilled' && hRes.value.data?.hotel) {
          setHotel(hRes.value.data.hotel);
        }

        let types = [];
        if (aRes.status === 'fulfilled' && aRes.value.data?.roomTypes) {
          types = aRes.value.data.roomTypes;
          setFloorBreakdown(aRes.value.data.floorBreakdown || null);
          setFloorStatus(aRes.value.data.floorStatus || null);
        } else {
          const fallbackRes = await getRoomTypes();
          types = fallbackRes.data?.roomTypes || [];
        }

        setAvailableRoomTypes(types);

        // Pre-select targeted room type if passed from homepage
        if (targetTypeId) {
          const matchingType = types.find(t => t.typeId === targetTypeId || t.id === targetTypeId);
          if (matchingType) {
            setSelectedRoomsCart({ [matchingType.typeId]: 1 });
          } else if (types.length > 0) {
            setSelectedRoomsCart({ [types[0].typeId]: 1 });
          }
        } else if (types.length > 0) {
          setSelectedRoomsCart({ [types[0].typeId]: 1 });
        }
      } catch (err) {
        console.warn('Initial load notice:', err);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Search Available Rooms Handler
  const handleSearchAvailableRooms = async (e, overrideFloor = null) => {
    if (e) e.preventDefault();
    setValidationError('');

    const targetFloor = overrideFloor !== null ? overrideFloor : preferredFloor;
    if (overrideFloor !== null) {
      setPreferredFloor(overrideFloor);
    }

    const cin = new Date(checkInDate);
    const cout = new Date(checkOutDate);

    if (isNaN(cin.getTime()) || isNaN(cout.getTime())) {
      setValidationError('Please select valid check-in and check-out dates.');
      return;
    }

    const isDay = stayPackage === 'day_stay';
    if (!isDay && cout <= cin) {
      setValidationError('Check-out date must be strictly after check-in date.');
      return;
    }

    setSearching(true);
    try {
      const res = await checkRoomAvailability(
        checkInDate,
        checkOutDate,
        adultsCount + childrenCount,
        stayPackage,
        roomsRequired,
        targetFloor
      );

      if (res.data?.roomTypes) {
        setAvailableRoomTypes(res.data.roomTypes);
        setFloorBreakdown(res.data.floorBreakdown || null);
        setFloorStatus(res.data.floorStatus || null);

        // Retain valid selections that remain available
        setSelectedRoomsCart(prev => {
          const updated = {};
          res.data.roomTypes.forEach(rt => {
            const currentQty = prev[rt.typeId] || 0;
            if (currentQty > 0 && rt.availableRoomsCount > 0) {
              updated[rt.typeId] = Math.min(currentQty, rt.availableRoomsCount);
            }
          });
          // If all cleared, auto-select 1st available room
          if (Object.keys(updated).length === 0) {
            const firstAvail = res.data.roomTypes.find(r => r.availableRoomsCount > 0);
            if (firstAvail) updated[firstAvail.typeId] = 1;
          }
          return updated;
        });
      }
    } catch (err) {
      setValidationError(err.response?.data?.message || 'Failed to check room availability.');
    } finally {
      setSearching(false);
    }
  };

  // Quantity Modifier in Cart
  const handleUpdateQuantity = (typeId, delta, maxAvailable) => {
    setSelectedRoomsCart(prev => {
      const current = prev[typeId] || 0;
      const next = current + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[typeId];
        return copy;
      }
      if (maxAvailable !== undefined && next > maxAvailable) {
        return prev;
      }
      return { ...prev, [typeId]: next };
    });
  };

  const handleSelectRoomDirectly = (typeId, maxAvailable) => {
    if (maxAvailable <= 0) return;
    setSelectedRoomsCart(prev => {
      const current = prev[typeId] || 0;
      if (current === 0) return { ...prev, [typeId]: 1 };
      return prev;
    });
  };

  // Pricing & Capacity rules according to user specifications:
  // Standard Room: Max 3 guests | Overnight ₹999 / night | Day Stay ₹1,399 / day
  // Deluxe Room: Max 5 guests | Overnight ₹1,199 / night | Day Stay ₹1,500 / day
  // Premium Room: Max 9 guests (2 Rooms Attached + Balcony) | Overnight ₹2,000 / night | Day Stay ₹3,499 / day
  const getRoomPrice = (typeId, pkg) => {
    const isDayOr24 = pkg === 'day_stay' || pkg === 'full_24h';
    if (typeId === 'rt-premium') return isDayOr24 ? 3499 : 2000;
    if (typeId === 'rt-deluxe') return isDayOr24 ? 1500 : 1199;
    return isDayOr24 ? 1399 : 999;
  };

  const getRoomCapacity = (typeId) => {
    if (typeId === 'rt-premium') return 9;
    if (typeId === 'rt-deluxe') return 5;
    return 3;
  };

  // Calculate Duration and Price
  const cin = new Date(checkInDate);
  const cout = new Date(checkOutDate);
  const rawDiff = Math.ceil((cout - cin) / (1000 * 60 * 60 * 24));
  const stayDuration = Math.max(1, isNaN(rawDiff) ? 1 : rawDiff);
  const nights = stayDuration;

  // Calculate Cart Summary
  const selectedEntries = Object.entries(selectedRoomsCart).filter(([_, qty]) => qty > 0);
  const totalSelectedRooms = selectedEntries.reduce((sum, [_, qty]) => sum + qty, 0);
  const totalGuests = (Number(adultsCount) || 0) + (Number(childrenCount) || 0);

  const selectedRoomsList = selectedEntries.map(([tId, qty]) => {
    const rt = availableRoomTypes.find(t => t.typeId === tId) || {
      typeId: tId,
      name: tId === 'rt-premium' ? 'Premium Room' : (tId === 'rt-deluxe' ? 'Deluxe Room' : 'Standard Room'),
    };
    const unitPrice = getRoomPrice(tId, stayPackage);
    const capacity = getRoomCapacity(tId);
    const subtotal = unitPrice * qty * stayDuration;
    return {
      typeId: tId,
      roomType: {
        ...rt,
        pricePerNight: unitPrice,
        occupancy: capacity,
        name: tId === 'rt-premium' ? 'Premium Room (2 Rooms Attached + Balcony)' : (rt.name || 'Room')
      },
      capacity,
      quantity: qty,
      subtotal
    };
  });

  const totalCartCapacity = selectedRoomsList.reduce((sum, item) => sum + (item.capacity * item.quantity), 0);
  const isCapacityExceeded = totalSelectedRooms > 0 && totalCartCapacity < totalGuests;

  const roomChargesSubtotal = selectedRoomsList.reduce((sum, item) => sum + item.subtotal, 0);
  const taxAmount = Math.round(roomChargesSubtotal * 0.12); // 12% GST
  const grandTotal = roomChargesSubtotal + taxAmount;

  // Proceed to Payment Handler
  const handleProceedToPayment = (e) => {
    e.preventDefault();
    setValidationError('');

    if (totalSelectedRooms === 0) {
      setValidationError('Please select at least one room category to reserve.');
      return;
    }

    if (totalCartCapacity < totalGuests) {
      setValidationError(
        `Room capacity limit exceeded! Selected room(s) accommodate at most ${totalCartCapacity} guests (Standard: 3 max, Deluxe: 5 max, Premium: 9 max). You have ${totalGuests} guests (${adultsCount} Adults, ${childrenCount} Children). Please select additional room(s).`
      );
      return;
    }

    if (!guestName.trim()) {
      setValidationError('Please enter guest full name.');
      return;
    }
    if (!guestEmail.trim()) {
      setValidationError('Please enter guest email address.');
      return;
    }
    if (!guestPhone.trim()) {
      setValidationError('Please enter guest contact phone number.');
      return;
    }

    const primarySelection = selectedRoomsList[0];

    const bookingPayload = {
      typeId: primarySelection.typeId,
      roomTypeName: primarySelection.roomType.name,
      selectedRooms: selectedRoomsList.map(item => ({
        typeId: item.typeId,
        quantity: item.quantity
      })),
      roomsCount: totalSelectedRooms,
      checkInDate,
      checkOutDate,
      stayPackage,
      preferredFloor,
      stayTypeName: currentPackageInfo.name,
      checkInTimeStr: currentPackageInfo.checkInTime,
      checkOutTimeStr: currentPackageInfo.checkOutTime,
      numberOfNights: nights,
      numberOfGuests: adultsCount + childrenCount,
      adultsCount,
      childrenCount,
      roomTotal: roomChargesSubtotal,
      tax: taxAmount,
      totalAmount: grandTotal,
      guestName: guestName.trim(),
      guestEmail: guestEmail.trim(),
      guestPhone: guestPhone.trim(),
      specialRequests: specialRequests.trim()
    };

    navigate('/payment', { state: { bookingPayload, hotel } });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F3F4] flex flex-col items-center justify-center p-6 gap-3">
        <Loader2 size={36} className="text-[#7B1123] animate-spin" />
        <span className="text-xs font-semibold text-slate-500">Loading hotel inventory & real-time rates...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 pb-24 font-sans">
      
      {/* Top Breadcrumb Bar */}
      <div className="bg-white border-b border-slate-200/90 py-3.5 px-4 sm:px-6 lg:px-8 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
          <button 
            onClick={() => navigate('/')} 
            className="flex items-center space-x-1.5 font-bold text-[#7B1123] hover:underline cursor-pointer"
          >
            <ArrowLeft size={15} />
            <span>Back to Hotel Overview</span>
          </button>
          
          <div className="flex items-center gap-2 font-medium text-slate-500">
            <span className="text-[#7B1123] font-bold">1. Select Rooms</span>
            <ChevronRight size={13} />
            <span>2. Secure Payment</span>
            <ChevronRight size={13} />
            <span>3. Confirmation</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">

        {/* Page Title & Hotel Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#7B1123]/10 text-[#7B1123] text-[10px] font-bold px-2 py-0.5 rounded tracking-wide uppercase">
                Direct Reservation System
              </span>
              <span className="text-slate-400 text-xs">•</span>
              <span className="text-slate-500 text-xs font-semibold">{hotel?.city || 'Madurai'}, {hotel?.state || 'Tamil Nadu'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              {hotel?.name || 'Hotel Saravana Grand'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Select your stay package, verify room availability, and configure multiple rooms for your group stay.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/60 shrink-0">
            <div className="flex items-center gap-1.5">
              <Clock size={16} className="text-[#7B1123]" />
              <div>
                <span className="block font-bold text-slate-800">{currentPackageInfo.checkInTime}</span>
                <span className="text-[10px] text-slate-400">Check-in</span>
              </div>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div className="flex items-center gap-1.5">
              <Clock size={16} className="text-[#7B1123]" />
              <div>
                <span className="block font-bold text-slate-800">{currentPackageInfo.checkOutTime}</span>
                <span className="text-[10px] text-slate-400">Check-out</span>
              </div>
            </div>
          </div>
        </div>

        {/* Error Notification Banner */}
        {validationError && (
          <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-start gap-3 text-xs text-rose-800 shadow-2xs">
            <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold">Reservation Notice: </span>
              {validationError}
            </div>
          </div>
        )}

        {/* 1. COMPREHENSIVE SEARCH & FILTER SECTION */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={18} className="text-[#7B1123]" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Search & Stay Configuration</h2>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Real-time date availability</span>
          </div>

          {/* Stay Package Selector Cards */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">Select Stay Package</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {STAY_PACKAGES.map(pkg => {
                const isSelected = stayPackage === pkg.id;
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => setStayPackage(pkg.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#7B1123] bg-[#7B1123]/5 shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${isSelected ? 'text-[#7B1123]' : 'text-slate-900'}`}>
                        {pkg.name}
                      </span>
                      {isSelected && <Check size={14} className="text-[#7B1123]" />}
                    </div>
                    <div className="text-[11px] font-semibold text-slate-600 mt-1 flex items-center gap-1">
                      <Clock size={12} className="text-slate-400 shrink-0" />
                      <span>{pkg.timing}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1.5 leading-snug line-clamp-2">
                      {pkg.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dates & Guests Search Grid */}
          <form onSubmit={handleSearchAvailableRooms} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3 pt-1">
            
            {/* Check-In Date */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase">Check-In Date</label>
              <div className="relative">
                <input
                  type="date"
                  min={getTodayStr()}
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#7B1123] font-medium"
                  required
                />
              </div>
            </div>

            {/* Check-Out Date */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase">Check-Out Date</label>
              <div className="relative">
                <input
                  type="date"
                  min={stayPackage === 'day_stay' ? checkInDate : getTomorrowStr(1)}
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#7B1123] font-medium"
                  required
                />
              </div>
            </div>

            {/* Adults */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase">Adults (12+ yrs)</label>
              <select
                value={adultsCount}
                onChange={(e) => setAdultsCount(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#7B1123] font-medium bg-white"
              >
                {[1, 2, 3, 4, 5, 6, 8, 10].map(n => (
                  <option key={n} value={n}>{n} Adult{n > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>

            {/* Children */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase">Children (0-11 yrs)</label>
              <select
                value={childrenCount}
                onChange={(e) => setChildrenCount(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#7B1123] font-medium bg-white"
              >
                {[0, 1, 2, 3, 4].map(n => (
                  <option key={n} value={n}>{n} Child{n !== 1 ? 'ren' : ''}</option>
                ))}
              </select>
            </div>

            {/* Rooms Required */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase">Rooms Needed</label>
              <select
                value={roomsRequired}
                onChange={(e) => setRoomsRequired(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#7B1123] font-medium bg-white"
              >
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <option key={n} value={n}>{n} Room{n > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>

            {/* Preferred Floor */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase">Preferred Floor</label>
              <select
                value={preferredFloor}
                onChange={(e) => {
                  const val = e.target.value;
                  setPreferredFloor(val);
                }}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#7B1123] font-medium bg-white"
              >
                <option value="any">Any Floor (No Preference)</option>
                <option value="1">1st Floor (Standard Executive)</option>
                <option value="2">2nd Floor (Deluxe Lounge)</option>
                <option value="3">3rd Floor (Premium Suites + Balcony)</option>
              </select>
            </div>

            {/* Search Button */}
            <div className="space-y-1 flex flex-col justify-end">
              <button
                type="submit"
                disabled={searching}
                className="w-full py-2 px-4 bg-[#7B1123] hover:bg-[#600D1B] text-white text-xs font-bold rounded-xl shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                <span>Search Available</span>
              </button>
            </div>

          </form>

          {/* Live Floor Vacancy Feedback & Switch Options */}
          {floorStatus && (
            <div className="mt-3.5">
              {floorStatus.hasVacancy ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-xs text-emerald-900">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold">Floor {floorStatus.preferredFloor} Vacancy Confirmed:</span>{' '}
                      <span>{floorStatus.availableCount} room(s) available on Floor {floorStatus.preferredFloor}. A room on your preferred floor will be reserved!</span>
                    </div>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0">
                    Floor {floorStatus.preferredFloor} Priority
                  </span>
                </div>
              ) : (
                <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl space-y-2 text-xs text-amber-950 shadow-xs">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-amber-900">
                        Floor {floorStatus.preferredFloor} is Fully Booked for these Dates!
                      </div>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        There are no vacant rooms remaining on Floor {floorStatus.preferredFloor}. Would you like to stay on 2nd Floor or 3rd Floor instead?
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 pt-1 pl-6">
                    <span className="text-[11px] font-semibold text-amber-900">Choose alternative floor:</span>
                    {floorStatus.alternateFloors && floorStatus.alternateFloors.length > 0 ? (
                      floorStatus.alternateFloors.map((alt) => (
                        <button
                          key={alt.floor}
                          type="button"
                          onClick={() => handleSearchAvailableRooms(null, String(alt.floor))}
                          className="px-3 py-1 bg-[#7B1123] hover:bg-[#600D1B] text-white rounded-lg font-bold text-xs transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <span>Select Floor {alt.floor} ({alt.available} rooms free)</span>
                        </button>
                      ))
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleSearchAvailableRooms(null, '2')}
                          className="px-3 py-1 bg-[#7B1123] hover:bg-[#600D1B] text-white rounded-lg font-bold text-xs transition-all cursor-pointer"
                        >
                          Select 2nd Floor
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSearchAvailableRooms(null, '3')}
                          className="px-3 py-1 bg-[#7B1123] hover:bg-[#600D1B] text-white rounded-lg font-bold text-xs transition-all cursor-pointer"
                        >
                          Select 3rd Floor
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => handleSearchAvailableRooms(null, 'any')}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-medium text-xs transition-all cursor-pointer"
                    >
                      Any Available Floor
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 2. MAIN LAYOUT: AVAILABLE ROOM CARDS + BOOKING SUMMARY SIDEBAR */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column (8 cols): Available Room Types */}
          <div className="lg:col-span-8 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Available Room Types</h2>
                <p className="text-xs text-slate-500">
                  Real-time inventory for {checkInDate} to {checkOutDate} ({nights} {nights === 1 ? 'day/night' : 'nights'})
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-500 bg-white px-3 py-1 rounded-lg border border-slate-200">
                {availableRoomTypes.length} Categories
              </span>
            </div>

            {availableRoomTypes.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                <BedDouble size={40} className="mx-auto text-slate-300" />
                <h3 className="text-base font-bold text-slate-800">No Room Categories Available</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  All rooms are reserved or unavailable for these exact dates. Please adjust your dates or stay package.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {availableRoomTypes.map((rt) => {
                  const availableCount = rt.availableRoomsCount !== undefined ? rt.availableRoomsCount : rt.totalRoomsCount || 4;
                  const isSoldOut = availableCount <= 0;
                  const currentSelectedQty = selectedRoomsCart[rt.typeId] || 0;
                  const isSelected = currentSelectedQty > 0;
                  const roomSubtotal = (rt.pricePerNight || 2000) * (currentSelectedQty || 1) * nights;

                  return (
                    <div 
                      key={rt.typeId}
                      className={`bg-white rounded-2xl border transition-all overflow-hidden shadow-2xs flex flex-col md:flex-row ${
                        isSelected 
                          ? 'border-[#7B1123] ring-1 ring-[#7B1123]' 
                          : 'border-slate-200/90 hover:border-slate-300'
                      }`}
                    >
                      {/* Room Photo Gallery */}
                      <div className="md:w-64 h-52 md:h-auto relative bg-slate-100 shrink-0">
                        <img 
                          src={rt.images?.[0] || 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80'} 
                          alt={rt.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2.5 left-2.5 bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded">
                          {rt.bedType || 'Plush Bed'}
                        </div>
                      </div>

                      {/* Room Details & Pricing */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        
                        <div>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="text-base font-extrabold text-slate-900">{rt.name}</h3>
                              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                                {rt.description}
                              </p>
                            </div>
                            
                            {/* Live Availability Badge */}
                            <div className="shrink-0 text-right">
                              {isSoldOut ? (
                                <span className="inline-block px-2.5 py-1 bg-rose-50 text-rose-700 text-[10px] font-bold rounded-lg border border-rose-200">
                                  Sold Out
                                </span>
                              ) : (
                                <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-lg border border-emerald-200">
                                  {availableCount} room{availableCount > 1 ? 's' : ''} available
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Room Specifications & Amenities */}
                          <div className="flex flex-wrap items-center gap-2 mt-3 text-[11px] font-medium text-slate-600">
                            <span className="flex items-center gap-1 bg-[#7B1123]/10 text-[#7B1123] px-2.5 py-0.5 rounded font-bold border border-[#7B1123]/20">
                              <Users size={12} className="text-[#7B1123]" />
                              <span>Max {getRoomCapacity(rt.typeId)} Guests / Room</span>
                            </span>
                            <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60">
                              <BedDouble size={12} className="text-[#7B1123]" />
                              <span>{rt.typeId === 'rt-premium' ? '2 Rooms Attached + Balcony' : (rt.bedType || 'King Bed')}</span>
                            </span>
                            {rt.typeId === 'rt-premium' && (
                              <span className="bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded font-semibold text-[10px]">
                                2 Attached Rooms Inside + Private Balcony
                              </span>
                            )}
                            {rt.amenities?.slice(0, 3).map((amenity, idx) => (
                              <span key={idx} className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60 text-slate-500">
                                {amenity}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Price & Quantity Selector Footer */}
                        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-xl font-extrabold text-slate-900">
                                ₹{getRoomPrice(rt.typeId, stayPackage).toLocaleString('en-IN')}
                              </span>
                              <span className="text-[11px] text-slate-400 font-medium">
                                {stayPackage === 'day_stay' ? '/ day' : (stayPackage === 'full_24h' ? '/ 24-hr stay' : '/ night')}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 block">
                              Total for {stayDuration} {stayPackage === 'day_stay' ? (stayDuration === 1 ? 'day' : 'days') : (stayDuration === 1 ? 'night' : 'nights')}: ₹{(getRoomPrice(rt.typeId, stayPackage) * stayDuration).toLocaleString('en-IN')} + taxes
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            {isSelected ? (
                              <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden shadow-2xs">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQuantity(rt.typeId, -1, availableCount)}
                                  className="p-2 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                                  title="Decrease room count"
                                >
                                  <Minus size={14} />
                                </button>
                                <span className="px-3 text-xs font-bold text-slate-900 min-w-8 text-center">
                                  {currentSelectedQty} {currentSelectedQty === 1 ? 'Room' : 'Rooms'}
                                </span>
                                <button
                                  type="button"
                                  disabled={currentSelectedQty >= availableCount}
                                  onClick={() => handleUpdateQuantity(rt.typeId, 1, availableCount)}
                                  className="p-2 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer disabled:opacity-40"
                                  title="Add another room of this category"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                disabled={isSoldOut}
                                onClick={() => handleSelectRoomDirectly(rt.typeId, availableCount)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                                  isSoldOut
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    : 'bg-[#7B1123] hover:bg-[#600D1B] text-white'
                                }`}
                              >
                                Select Room
                              </button>
                            )}
                          </div>

                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column (4 cols): Sticky Booking Summary & Guest Details Form */}
          <div className="lg:col-span-4 space-y-5 sticky top-6">
            
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-[10px] uppercase font-bold text-[#7B1123] tracking-wide">Reservation Overview</span>
                <h3 className="text-base font-extrabold text-slate-900 mt-0.5">{hotel?.name || 'Hotel Saravana Grand'}</h3>
              </div>

              {/* Selected Stay Dates & Timings */}
              <div className="space-y-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Dates:</span>
                  <span className="font-bold text-slate-800">{checkInDate} to {checkOutDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Package:</span>
                  <span className="font-bold text-slate-800">{currentPackageInfo.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Stay Duration:</span>
                  <span className="font-bold text-slate-800">
                    {stayDuration} {stayPackage === 'day_stay' ? (stayDuration === 1 ? 'Day' : 'Days') : (stayDuration === 1 ? 'Night' : 'Nights')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Total Guests:</span>
                  <span className="font-bold text-slate-800">{totalGuests} ({adultsCount} Adults{childrenCount > 0 ? `, ${childrenCount} Children` : ''})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Floor Preference:</span>
                  <span className="font-bold text-slate-800">
                    {preferredFloor === 'any' ? 'Any Available Floor' : `Floor ${preferredFloor}`}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-500 font-medium">Room Capacity:</span>
                  <span className={`font-bold ${isCapacityExceeded ? 'text-rose-600' : 'text-emerald-700'}`}>
                    {totalCartCapacity} Guests Max
                  </span>
                </div>
              </div>

              {/* Room Capacity Validation Alert */}
              {isCapacityExceeded && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-rose-700">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>Room Capacity Limit Exceeded</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-rose-700">
                    Your selected room(s) can accommodate at most {totalCartCapacity} guests (Standard: 3 max, Deluxe: 5 max, Premium: 9 max), but you have {totalGuests} guests. Please book additional rooms to continue.
                  </p>
                </div>
              )}

              {/* Selected Room Types Breakdown */}
              <div className="space-y-2 text-xs">
                <div className="font-bold text-slate-700 flex justify-between">
                  <span>Selected Rooms ({totalSelectedRooms})</span>
                  <span className="text-slate-400 font-normal">Subtotal</span>
                </div>

                {selectedRoomsList.length === 0 ? (
                  <p className="text-slate-400 italic text-[11px] py-1">No rooms chosen yet. Click "Select Room" above.</p>
                ) : (
                  <div className="space-y-1.5 divide-y divide-slate-100">
                    {selectedRoomsList.map((item) => (
                      <div key={item.typeId} className="pt-1.5 flex justify-between items-center text-slate-700">
                        <div>
                          <span className="font-bold text-slate-900">{item.quantity}x {item.roomType.name}</span>
                          <span className="block text-[10px] text-slate-400">₹{item.roomType.pricePerNight} × {nights} night(s)</span>
                        </div>
                        <span className="font-bold text-slate-900">₹{item.subtotal.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Price Calculation */}
              <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Room Charges Subtotal</span>
                  <span>₹{roomChargesSubtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Taxes & Fees (12% GST)</span>
                  <span>₹{taxAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-900 text-sm font-extrabold pt-2 border-t border-slate-100">
                  <span>Total Amount</span>
                  <span className="text-[#7B1123]">₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Guest Contact Details Form */}
              <div className="pt-3 border-t border-slate-100 space-y-2.5">
                <span className="text-[11px] font-bold text-slate-700 uppercase block">Guest Information</span>
                
                <div>
                  <label className="text-[10px] text-slate-500 font-medium block">Full Name *</label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#7B1123]"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-medium block">Email Address *</label>
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="e.g. ramesh@example.com"
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#7B1123]"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-medium block">Contact Phone *</label>
                  <input
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#7B1123]"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-medium block">Special Requests (Optional)</label>
                  <input
                    type="text"
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="e.g. Quiet floor, early check-in"
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#7B1123]"
                  />
                </div>
              </div>

              {/* Cancellation Policy Badge */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-[11px] text-emerald-800 space-y-1">
                <div className="font-bold flex items-center gap-1 text-emerald-900">
                  <ShieldCheck size={14} />
                  <span>Free Cancellation Policy</span>
                </div>
                <p className="text-[10px] leading-tight text-emerald-700">
                  Cancel for free up to 24 hours prior to check-in. Instant refunds processed to original payment method.
                </p>
              </div>

              {/* Continue to Payment Button */}
              <button
                type="button"
                onClick={handleProceedToPayment}
                disabled={totalSelectedRooms === 0}
                className="w-full py-3 bg-[#7B1123] hover:bg-[#600D1B] text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>Continue to Payment</span>
                <ChevronRight size={15} />
              </button>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default RoomBooking;
