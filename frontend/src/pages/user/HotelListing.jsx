import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getLocalHotels, getLocalBookings } from '../../services/api';
import { 
  Bed, 
  Search, 
  MapPin, 
  Star, 
  Heart, 
  ChevronRight, 
  CheckCircle2,
  ShieldCheck,
  Loader2,
  Sparkles,
  Filter
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const HotelListing = () => {
  const navigate = useNavigate();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [maxBudget, setMaxBudget] = useState(15000);
  const [sortBy, setSortBy] = useState('top-picks');
  const [bookedRoomIds, setBookedRoomIds] = useState(new Set());

  // Fetch all hotels & active bookings for real-time room availability sync
  const fetchAllHotelsAndBookings = async () => {
    setLoading(true);
    try {
      // 1. Fetch hotels from backend API and combine with local dataset
      let apiHotels = [];
      try {
        const response = await axios.get(`${API_BASE_URL}/hotels`, { timeout: 3000 });
        if (response.data && Array.isArray(response.data)) {
          apiHotels = response.data;
        }
      } catch (err) {
        console.warn("Backend hotels fetch notice:", err.message);
      }

      const localHotels = getLocalHotels();

      // Combine API hotels and local storage hotels, deduplicating by ID or name
      const hotelMap = new Map();
      
      // Add local hotels first
      localHotels.forEach(h => {
        const key = (h.id || h.hotelId || h.name || '').toString().toLowerCase().trim();
        if (key) hotelMap.set(key, h);
      });

      // Overlay/Add API hotels
      apiHotels.forEach(h => {
        const key = (h.id || h.hotelId || h.name || '').toString().toLowerCase().trim();
        if (key) hotelMap.set(key, h);
      });

      const combinedHotels = Array.from(hotelMap.values());
      setHotels(combinedHotels);

      // 2. Fetch all confirmed bookings to track booked rooms in real-time
      let confirmedBookings = [];
      try {
        const bkRes = await axios.get(`${API_BASE_URL}/bookings/all`, { timeout: 3000 });
        if (bkRes.data && Array.isArray(bkRes.data)) {
          confirmedBookings = bkRes.data;
        } else {
          confirmedBookings = getLocalBookings();
        }
      } catch (err) {
        confirmedBookings = getLocalBookings();
      }

      const bookedSet = new Set(
        confirmedBookings
          .filter(b => b.bookingStatus === 'Confirmed' || b.paymentStatus === 'Paid')
          .map(b => `${b.hotelId}_${b.roomId}`)
      );
      setBookedRoomIds(bookedSet);

    } catch (error) {
      console.warn("Notice loading hotel dataset:", error.message);
      setHotels(getLocalHotels());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllHotelsAndBookings();
  }, []);

  // Filter & Search Logic across all properties
  const filteredHotels = hotels.filter(hotel => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch = !term || 
      hotel.name.toLowerCase().includes(term) || 
      hotel.city.toLowerCase().includes(term) || 
      (hotel.locationName && hotel.locationName.toLowerCase().includes(term)) ||
      (hotel.description && hotel.description.toLowerCase().includes(term));

    const minPrice = Math.min(...(hotel.rooms || []).map(r => r.pricePerNight || 2500));
    const matchesBudget = minPrice <= maxBudget;

    return matchesSearch && matchesBudget;
  }).sort((a, b) => {
    if (sortBy === 'lowest-price') {
      const minA = Math.min(...(a.rooms || []).map(r => r.pricePerNight || 2500));
      const minB = Math.min(...(b.rooms || []).map(r => r.pricePerNight || 2500));
      return minA - minB;
    }
    if (sortBy === 'top-reviewed') {
      return b.rating - a.rating;
    }
    return 0;
  });

  return (
    <div className="min-h-screen bg-[#F6F3F4] text-slate-900 pb-20 font-sans">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-5">
        
        {/* Page Title Header (Screenshot 1 Style) */}
        <div className="space-y-0.5">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Hotels Available
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Showing {filteredHotels.length} of {hotels.length} hotels
          </p>
        </div>

        {/* White Search & Filter Container (Screenshot 1 Style) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search hotels by name or location..."
                className="w-full bg-[#f1f4f9] border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#7B1E3A]"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-[#f1f4f9] border border-slate-200 text-slate-700 text-xs font-medium rounded-xl px-3 py-2 focus:outline-none focus:bg-white"
              >
                <option value="top-picks">Top Choice</option>
                <option value="lowest-price">Sort by Price</option>
                <option value="top-reviewed">Sort by Rating</option>
              </select>

              <select
                value={maxBudget}
                onChange={(e) => setMaxBudget(Number(e.target.value))}
                className="bg-[#f1f4f9] border border-slate-200 text-slate-700 text-xs font-medium rounded-xl px-3 py-2 focus:outline-none focus:bg-white"
              >
                <option value={15000}>All Price Ranges</option>
                <option value={3500}>Under ₹ 3,500</option>
                <option value={6000}>Under ₹ 6,000</option>
              </select>
            </div>
          </div>

          {/* Active Category Tag Pill (Screenshot 1 Style) */}
          <div className="flex items-center space-x-2 pt-1">
            <span className="bg-[#7B1E3A] text-white text-[11px] font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
              <span>Personalized Stays</span>
              <span className="bg-white/20 text-white px-1.5 py-0.2 rounded-full text-[10px]">{filteredHotels.length}</span>
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center flex flex-col items-center justify-center space-y-3 bg-white rounded-2xl border border-slate-200/80">
            <Loader2 size={32} className="text-[#7B1E3A] animate-spin" />
            <p className="text-xs font-semibold text-slate-600">Loading hotel properties...</p>
          </div>
        ) : filteredHotels.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3 shadow-xs">
            <Bed size={36} className="text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No hotels match your search criteria</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try clearing your search keyword or increasing your budget filter.
            </p>
            <button onClick={() => { setSearchTerm(''); setMaxBudget(15000); }} className="px-4 py-2 bg-[#7B1E3A] text-white text-xs font-semibold rounded-xl">
              Reset Search Filters
            </button>
          </div>
        ) : (
          /* Card Grid (Screenshot 1 Style) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredHotels.map((hotel, idx) => {
              const hotelId = hotel.id || hotel.hotelId;
              const defaultRoom = (hotel.rooms && hotel.rooms.length > 0) ? (hotel.rooms[1] || hotel.rooms[0]) : { type: 'Executive Double Room', occupancy: 2, pricePerNight: 3500 };
              const minPrice = defaultRoom.pricePerNight || 3500;

              return (
                <div 
                  key={hotelId} 
                  className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                >
                  
                  {/* Top Image */}
                  <div className="relative h-48 bg-slate-100 overflow-hidden">
                    <img 
                      src={hotel.images[0]} 
                      alt={hotel.name} 
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" 
                    />
                    
                    <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-slate-800 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs flex items-center gap-1">
                      <Star size={12} className="fill-amber-400 text-amber-400" />
                      <span>{hotel.rating} Excellent</span>
                    </span>

                    <button className="absolute top-3 right-3 p-1.5 bg-slate-900/40 hover:bg-slate-900/60 rounded-full text-white transition-colors">
                      <Heart size={15} />
                    </button>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <h3 
                        onClick={() => navigate(`/hotel/${hotelId}`)}
                        className="text-base font-bold text-slate-900 hover:text-[#7B1E3A] cursor-pointer line-clamp-1"
                      >
                        {hotel.name}
                      </h3>

                      <div className="text-xs text-slate-500 flex items-center space-x-1 font-medium">
                        <MapPin size={13} className="text-[#7B1E3A]" />
                        <span className="line-clamp-1">{hotel.locationName || `${hotel.city}, Tamil Nadu`}</span>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed pt-1">
                        {hotel.description || 'Verified property offering comfortable AC rooms and prompt room service.'}
                      </p>
                    </div>

                    {/* Footer Row: Price & Action */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block uppercase">Starting From</span>
                        <div className="text-lg font-black text-slate-900">
                          ₹ {minPrice.toLocaleString('en-IN')}
                          <span className="text-[10px] text-slate-500 font-normal"> / night</span>
                        </div>
                      </div>

                      <button
                        onClick={() => navigate(`/hotel/${hotelId}`)}
                        className="px-4 py-2 bg-[#7B1E3A] hover:bg-[#5C152C] text-white text-xs font-semibold rounded-xl transition-colors shadow-xs flex items-center gap-1"
                      >
                        <span>View Details</span>
                        <ChevronRight size={14} />
                      </button>
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

export default HotelListing;
