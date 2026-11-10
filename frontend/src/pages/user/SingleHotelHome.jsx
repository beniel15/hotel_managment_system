import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getHotelProfile, 
  getRoomTypes, 
  checkRoomAvailability, 
  getReviews 
} from '../../services/api';
import { 
  Building2, 
  Calendar, 
  Users, 
  Star,
  BedDouble, 
  MapPin, 
  Phone, 
  Mail, 
  CheckCircle2, 
  Lock, 
  ArrowRight, 
  ShieldCheck, 
  Clock, 
  Sparkles,
  Loader2,
  AlertCircle,
  Wifi,
  Car,
  Utensils,
  Waves,
  Search,
  Maximize2
} from 'lucide-react';

const DEFAULT_ROOMS = [
  {
    typeId: 'rt-standard',
    name: 'Standard Room',
    description: 'Comfortable air-conditioned executive room with queen bed, ergonomic work desk, high-speed Wi-Fi, and ensuite shower. Max 3 guests per room.',
    occupancy: 3,
    pricePerNight: 999,
    dayStayPrice: 1399,
    bedType: '1 Queen Bed',
    images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'],
    isAvailable: true,
    availableRoomsCount: 9
  },
  {
    typeId: 'rt-deluxe',
    name: 'Deluxe Room',
    description: 'Spacious luxury room with king-size bed, sofa sitting lounge, 43" Smart TV, wardrobe, and ensuite geyser bathroom. Max 5 guests per room.',
    occupancy: 5,
    pricePerNight: 1199,
    dayStayPrice: 1500,
    bedType: '1 King Bed + Sofa Bed',
    images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'],
    isAvailable: true,
    availableRoomsCount: 6
  },
  {
    typeId: 'rt-premium',
    name: 'Premium Room',
    description: '2 rooms attached inside with private scenic balcony, 2 smart TVs, mini-fridge, double vanity, and spacious living parlor. Max 9 guests per room.',
    occupancy: 9,
    pricePerNight: 2000,
    dayStayPrice: 3499,
    bedType: '2 Rooms Attached + Balcony',
    images: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'],
    isAvailable: true,
    availableRoomsCount: 4
  }
];

const SingleHotelHome = () => {
  const navigate = useNavigate();

  // Hotel Profile State
  const [hotel, setHotel] = useState(null);
  const [roomTypes, setRoomTypes] = useState(DEFAULT_ROOMS);
  const [reviewsData, setReviewsData] = useState({ stats: null, reviews: [] });
  const [loading, setLoading] = useState(false);

  // Availability Search State
  const getTomorrowStr = (daysAhead = 1) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString().split('T')[0];
  };

  const [checkInDate, setCheckInDate] = useState(() => getTomorrowStr(0));
  const [checkOutDate, setCheckOutDate] = useState(() => getTomorrowStr(3));
  const [guests, setGuests] = useState(2);
  const [searching, setSearching] = useState(false);
  const [availabilityResults, setAvailabilityResults] = useState(null);

  // Gallery Active Image
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  // Fetch initial single-hotel data
  useEffect(() => {
    const loadHotelData = async () => {
      try {
        const [hotelRes, typesRes, reviewsRes] = await Promise.allSettled([
          getHotelProfile(),
          getRoomTypes(),
          getReviews()
        ]);

        if (hotelRes.status === 'fulfilled' && hotelRes.value.data?.hotel) {
          setHotel(hotelRes.value.data.hotel);
        }
        if (typesRes.status === 'fulfilled' && typesRes.value.data?.roomTypes?.length > 0) {
          setRoomTypes(typesRes.value.data.roomTypes);
        }
        if (reviewsRes.status === 'fulfilled' && reviewsRes.value.data) {
          setReviewsData(reviewsRes.value.data);
        }
      } catch (err) {
        console.warn('Hotel loading notice:', err);
      }
    };

    loadHotelData();
  }, []);

  // Perform Real-Time Availability Check
  const handleCheckAvailability = async (e) => {
    if (e) e.preventDefault();
    setSearching(true);
    try {
      const res = await checkRoomAvailability(checkInDate, checkOutDate, guests);
      if (res.data && res.data.roomTypes && res.data.roomTypes.length > 0) {
        setAvailabilityResults(res.data.roomTypes);
      }
    } catch (err) {
      console.warn('Availability check notice:', err);
    } finally {
      setSearching(false);
    }
  };

  // Rooms to display: never empty, always show room types
  const displayedRooms = (availabilityResults && availabilityResults.length > 0)
    ? availabilityResults
    : (roomTypes && roomTypes.length > 0 ? roomTypes : DEFAULT_ROOMS);

  const handleBookNow = (roomType) => {
    navigate(`/book/${roomType.typeId}`, {
      state: {
        roomType,
        checkInDate,
        checkOutDate,
        guests
      }
    });
  };

  const formatPrettyDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const heroImage = hotel?.images?.[0] || 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1600&q=80';

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 pb-20 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 space-y-9">

        {/* 1. HERO SECTION WITH LUXURY BACKGROUND & SEARCH PILL */}
        <div className="relative rounded-3xl overflow-hidden shadow-md">
          {/* Background image */}
          <div className="relative h-[480px] w-full">
            <img 
              src={heroImage} 
              alt="Hotel Room" 
              className="w-full h-full object-cover brightness-[0.88]"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
            
            {/* Hero Text Content */}
            <div className="absolute inset-0 p-8 sm:p-12 lg:p-16 flex flex-col justify-between">
              <div className="max-w-xl text-white space-y-4">
                <h1 className="text-3xl sm:text-5xl font-extrabold leading-[1.15] tracking-tight">
                  A Comfortable Stay<br />
                  in the Heart of the City
                </h1>
                <p className="text-sm sm:text-base text-white/90 font-normal max-w-md leading-relaxed">
                  Book your perfect stay with modern rooms, great food and premium amenities.
                </p>

                {/* Amenities Row with Icons */}
                <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-medium text-white/95">
                  <span className="inline-flex items-center gap-1.5">
                    <BedDouble size={16} /> Luxury Rooms
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Utensils size={16} /> Multi-Cuisine
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Wifi size={16} /> Free Wi-Fi
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Car size={16} /> Parking
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Waves size={16} /> Swimming Pool
                  </span>
                </div>
              </div>

              {/* Overlaid Floating Pill Search Box */}
              <div className="w-full max-w-3xl bg-white rounded-2xl sm:rounded-full p-2.5 sm:p-3 shadow-2xl border border-white/40">
                <form 
                  onSubmit={handleCheckAvailability}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center"
                >
                  {/* Check-In Pill */}
                  <div className="px-5 py-1.5 sm:border-r border-slate-200">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-[#7B1123] shrink-0" />
                      <div>
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Check-in
                        </span>
                        <div className="text-xs font-bold text-slate-900 leading-tight">
                          {formatPrettyDate(checkInDate)}
                        </div>
                      </div>
                    </div>
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={checkInDate}
                      onChange={(e) => setCheckInDate(e.target.value)}
                      className="mt-1 w-full text-[11px] bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-slate-700 font-medium"
                    />
                  </div>

                  {/* Check-Out Pill */}
                  <div className="px-5 py-1.5 sm:border-r border-slate-200">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-[#7B1123] shrink-0" />
                      <div>
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Check-out
                        </span>
                        <div className="text-xs font-bold text-slate-900 leading-tight">
                          {formatPrettyDate(checkOutDate)}
                        </div>
                      </div>
                    </div>
                    <input
                      type="date"
                      min={checkInDate || new Date().toISOString().split('T')[0]}
                      value={checkOutDate}
                      onChange={(e) => setCheckOutDate(e.target.value)}
                      className="mt-1 w-full text-[11px] bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-slate-700 font-medium"
                    />
                  </div>

                  {/* Search Rooms Maroon Button */}
                  <div className="px-2">
                    <button
                      type="submit"
                      disabled={searching}
                      className="w-full h-11 bg-[#7B1123] hover:bg-[#600D1B] text-white font-semibold rounded-xl sm:rounded-full text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] cursor-pointer"
                    >
                      {searching ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Search size={15} />
                      )}
                      <span>{searching ? 'Checking...' : 'Search Rooms'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* 2. EXPLORE OUR ROOMS SECTION (ALWAYS SHOWS ROOMS) */}
        <section id="rooms" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-1 h-6 bg-[#7B1123] rounded-full inline-block" />
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Explore Our Rooms</h2>
            </div>
            <a 
              href="#rooms" 
              className="text-xs font-bold text-[#7B1123] hover:underline flex items-center gap-1"
            >
              <span>View All Rooms</span>
              <ArrowRight size={13} />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {displayedRooms.slice(0, 3).map((room, idx) => {
              const isAvailable = room.isAvailable !== false && (room.availableRoomsCount === undefined || room.availableRoomsCount > 0);
              const isPopular = idx === 1 || room.name?.toLowerCase().includes('deluxe');

              return (
                <div 
                  key={room.typeId || idx}
                  className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Room Photo & Badges */}
                    <div className="relative h-48 bg-slate-100 overflow-hidden">
                      <img 
                        src={room.images?.[0] || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'} 
                        alt={room.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                      {isPopular && (
                        <span className="absolute top-3 right-3 bg-[#80182A] text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-xs">
                          Most Popular
                        </span>
                      )}
                      {!isAvailable && (
                        <span className="absolute top-3 left-3 bg-rose-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Lock size={10} /> Fully Booked
                        </span>
                      )}
                    </div>

                    {/* Room Info */}
                    <div className="p-4 space-y-2.5">
                      <h3 className="text-base font-bold text-slate-900">{room.name}</h3>
                      
                      <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                        <span className="inline-flex items-center gap-1">
                          <Users size={13} className="text-slate-400" />
                          {room.occupancy ? `${room.occupancy} Guests` : '2 Guests'}
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1">
                          <BedDouble size={13} className="text-slate-400" />
                          {idx === 0 ? '1 Bed' : idx === 1 ? '1 King Bed' : '1 King Bed'}
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1">
                          <Maximize2 size={12} className="text-slate-400" />
                          {idx === 0 ? '180 sq.ft' : idx === 1 ? '240 sq.ft' : '350 sq.ft'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Price & Action Button */}
                  <div className="p-4 pt-1 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-base font-extrabold text-slate-900">
                        ₹{(room.pricePerNight || 2500).toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-slate-400 font-medium"> / night</span>
                    </div>

                    <button
                      onClick={() => handleBookNow(room)}
                      className="px-4 py-1.5 rounded-full border border-slate-300 text-xs font-semibold text-slate-800 hover:border-[#7B1123] hover:text-[#7B1123] hover:bg-rose-50/40 transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 3. HOTEL FACILITIES & SERVICES */}
        <section id="facilities" className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 space-y-5 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-1 h-6 bg-[#7B1123] rounded-full inline-block" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Hotel Facilities & Services</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              'High-Speed Wi-Fi',
              'Swimming Pool',
              'Fine Dining Restaurant',
              '24/7 Front Desk',
              'Free Valet Parking',
              'Room Service',
              'Conference Hall',
              'Daily Housekeeping'
            ].map((item, idx) => (
              <div 
                key={idx}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-[#F8F9FA] border border-slate-200/80 text-xs font-semibold text-slate-800"
              >
                <CheckCircle2 size={15} className="text-[#1B7A42] shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 4. PHOTO GALLERY */}
        <section className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-1 h-6 bg-[#7B1123] rounded-full inline-block" />
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Hotel Gallery</h2>
            </div>
            <span className="text-xs text-slate-400">Click to view photograph</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 h-72 sm:h-96 rounded-xl overflow-hidden border border-slate-200 bg-slate-950">
              <img 
                src={hotel?.images?.[activeImageIdx] || heroImage} 
                alt="Hotel Large View" 
                className="w-full h-full object-cover"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5 content-start">
              {(hotel?.images || [
                heroImage,
                'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'
              ]).slice(0, 4).map((imgUrl, idx) => (
                <div 
                  key={idx}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`h-24 sm:h-28 rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                    activeImageIdx === idx ? 'border-[#7B1123] ring-2 ring-[#7B1123]/20' : 'border-slate-200 opacity-80 hover:opacity-100'
                  }`}
                >
                  <img src={imgUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. GUEST REVIEWS */}
        <section id="reviews" className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 space-y-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-1 h-6 bg-[#7B1123] rounded-full inline-block" />
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Verified Guest Reviews</h2>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-50 text-[#1B7A42] px-3 py-1 rounded-full text-xs font-bold border border-emerald-200">
              <Star size={13} className="fill-[#1B7A42]" />
              <span>{reviewsData.stats?.averageRating ? reviewsData.stats.averageRating.toFixed(1) : '4.8'} / 5.0</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {reviewsData.reviews?.length > 0 ? (
              reviewsData.reviews.slice(0, 3).map((rev, i) => (
                <div key={i} className="p-4 rounded-xl bg-[#F8F9FA] border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">{rev.guestName}</span>
                    <div className="flex text-amber-400">
                      {Array.from({ length: rev.rating || 5 }).map((_, s) => (
                        <Star key={s} size={11} className="fill-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">"{rev.comment}"</p>
                </div>
              ))
            ) : (
              <div className="col-span-3 py-8 text-center text-xs text-slate-400">
                No verified reviews submitted yet.
              </div>
            )}
          </div>
        </section>

        {/* 6. HOTEL LOCATION & CONTACT SECTION */}
        <section id="contact" className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 space-y-5 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-1 h-6 bg-[#7B1123] rounded-full inline-block" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Contact & Location</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
            <div className="p-4 rounded-xl bg-[#F8F9FA] border border-slate-200/80 space-y-2">
              <span className="font-bold text-slate-900 flex items-center gap-2">
                <MapPin size={16} className="text-[#7B1123]" /> Hotel Address
              </span>
              <p className="text-slate-600 leading-relaxed">
                {hotel?.locationAddress || 'Mattuthavani Bus Stand Road, Near Periyar Bus Stand, Madurai, Tamil Nadu 625020'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#F8F9FA] border border-slate-200/80 space-y-2">
              <span className="font-bold text-slate-900 flex items-center gap-2">
                <Phone size={16} className="text-[#7B1123]" /> Reservations & Inquiries
              </span>
              <p className="text-slate-600">Phone: {hotel?.phone || '+91 452 234 5678'}</p>
              <p className="text-slate-600">Email: {hotel?.email || 'reservations@hotelsaravanagrand.com'}</p>
            </div>

            <div className="p-4 rounded-xl bg-[#F8F9FA] border border-slate-200/80 space-y-2">
              <span className="font-bold text-slate-900 flex items-center gap-2">
                <Clock size={16} className="text-[#7B1123]" /> Check-In & Check-Out
              </span>
              <p className="text-slate-600">Check-In: <strong>{hotel?.checkInTime || '12:00 PM'}</strong></p>
              <p className="text-slate-600">Check-Out: <strong>{hotel?.checkOutTime || '11:00 AM'}</strong></p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default SingleHotelHome;
