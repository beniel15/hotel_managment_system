import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getLocalHotels, getLocalBookings } from '../../services/api';
import { 
  Star, 
  MapPin, 
  CheckCircle2, 
  ArrowLeft,
  ChevronRight,
  Lock,
  AlertCircle
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const HotelDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hotel, setHotel] = useState(() => {
    const hotels = getLocalHotels();
    return hotels.find(h => h.id === id || h.hotelId === id) || null;
  });
  const [selectedImage, setSelectedImage] = useState(0);
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        let foundHotel = hotel;
        if (!foundHotel) {
          try {
            const res = await axios.get(`${API_BASE_URL}/hotels/${id}`, { timeout: 2000 });
            if (res.data) foundHotel = res.data;
          } catch (err) {
            const hotels = getLocalHotels();
            foundHotel = hotels.find(h => h.id === id || h.hotelId === id);
          }
        }

        if (foundHotel) setHotel(foundHotel);

        // Fetch confirmed bookings
        let confirmedBookings = [];
        try {
          const bkRes = await axios.get(`${API_BASE_URL}/bookings/all`, { timeout: 2000 });
          if (bkRes.data && Array.isArray(bkRes.data)) {
            confirmedBookings = bkRes.data;
          } else {
            confirmedBookings = getLocalBookings();
          }
        } catch (err) {
          confirmedBookings = getLocalBookings();
        }

        setAllBookings(confirmedBookings);

      } catch (error) {
        console.warn("Hotel details loading notice:", error);
      }
    };

    fetchDetails();
  }, [id]);

  if (!hotel) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <p className="text-sm font-bold text-slate-700">Property not found</p>
          <button onClick={() => navigate('/')} className="px-4 py-2 bg-[#006ce4] text-white text-xs font-bold rounded-xl">
            Back to Hotels
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F3F4] text-slate-900 pb-20 font-sans">
      
      {/* Navigation Bar */}
      <div className="bg-white border-b border-slate-200/80 py-4 px-4 sm:px-6 lg:px-8 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center space-x-1.5 font-semibold text-[#7B1E3A] hover:underline"
          >
            <ArrowLeft size={16} />
            <span>Back to All Hotels</span>
          </button>
          
          <div className="text-slate-500 font-medium">
            <span>{hotel.city}</span> · <span className="font-semibold text-slate-800">{hotel.locationName}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-8">
        
        {/* Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200/80 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{hotel.name}</h1>
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} className="fill-amber-400" />
                ))}
              </div>
            </div>
            <p className="text-xs text-slate-500 flex items-center space-x-1 mt-1 font-medium">
              <MapPin size={14} className="text-[#7B1E3A]" />
              <span>{hotel.locationName}</span>
            </p>
          </div>

          <div className="bg-[#7B1E3A]/10 border border-[#7B1E3A]/20 px-4 py-2.5 rounded-xl text-right">
            <span className="text-[10px] text-slate-500 font-semibold block uppercase tracking-wider">Review Rating</span>
            <span className="text-sm font-black text-[#7B1E3A]">{hotel.rating} / 5 ({hotel.reviewsCount} reviews)</span>
          </div>
        </div>

        {/* Gallery */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">Hotel & Room Views Gallery</h2>
            <span className="text-xs text-slate-500">Click any thumbnail to preview interior views</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 h-80 sm:h-[420px] rounded-2xl overflow-hidden border border-slate-200/80 relative group bg-slate-900">
              <img 
                src={hotel.images[selectedImage] || hotel.images[0]} 
                alt={hotel.name} 
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-xs font-semibold border border-white/20">
                {selectedImage === 0 && "🏨 Building Exterior Facade View"}
                {selectedImage === 1 && "🛏️ Hotel Inside View (Double Bed, Wardrobe & Swan Towels)"}
                {selectedImage === 2 && "🪑 Room Table & Desk Area View"}
                {selectedImage === 3 && "🛋️ Sofa & Sitting Corner View"}
                {selectedImage === 4 && "🚿 Attached Bathroom View"}
                {selectedImage > 4 && `📷 View #${selectedImage + 1}`}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2.5 overflow-x-auto lg:overflow-visible">
              {hotel.images.map((imgUrl, idx) => {
                const labels = [
                  "Building Facade",
                  "Inside Room View",
                  "Table & Desk",
                  "Sofa Corner",
                  "Bathroom View"
                ];
                return (
                  <div 
                    key={idx} 
                    onClick={() => setSelectedImage(idx)}
                    className={`relative h-24 sm:h-28 rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                      selectedImage === idx ? 'border-[#7B1E3A] ring-2 ring-[#7B1E3A]/30' : 'border-slate-200/80 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img src={imgUrl} alt={labels[idx] || `View ${idx + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-slate-900/70 text-white text-[9px] font-bold text-center py-0.5 px-1 truncate">
                      {labels[idx] || `View ${idx + 1}`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Description & Popular Amenities */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-3 shadow-xs">
              <h2 className="text-lg font-extrabold text-slate-900">Property Overview</h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                {hotel.description}
              </p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-3 shadow-xs">
              <h2 className="text-lg font-extrabold text-slate-900">Most Popular Amenities</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {hotel.amenities.map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-2 bg-[#f8fafc] p-2.5 rounded-xl border border-slate-200/80 text-xs text-slate-700 font-medium">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ROOM TYPES & AVAILABILITY */}
        <div className="space-y-4 pt-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-extrabold text-slate-900">Available Room Categories</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {hotel.rooms.map((room) => {
              const bookedRoomsCount = allBookings
                .filter(b => (b.hotelId === id || b.hotelId === hotel.id || b.hotelId === hotel.hotelId) && b.roomId === room.id && (b.bookingStatus === 'Confirmed' || b.bookingStatus === 'CheckedIn' || b.paymentStatus === 'Paid'))
                .reduce((sum, b) => sum + (b.numberOfRooms || 1), 0);

              const totalCapacity = room.available || 8;
              const remainingCount = Math.max(0, totalCapacity - bookedRoomsCount);
              const isSoldOut = remainingCount <= 0;

              return (
                <div 
                  key={room.id} 
                  className={`bg-white border rounded-2xl p-6 flex flex-col justify-between space-y-4 shadow-xs transition-all ${
                    isSoldOut ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200/80 hover:border-[#7B1E3A]'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="inline-block bg-[#7B1E3A]/10 border border-[#7B1E3A]/20 text-[#7B1E3A] text-[10px] font-bold px-2.5 py-1 rounded-full">
                        {room.occupancy} Occupancy ({room.occupancy === 1 ? 'Single' : room.occupancy === 2 ? 'Double' : 'Triple'})
                      </span>

                      {isSoldOut ? (
                        <span className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                          <Lock size={12} /> SOLD OUT
                        </span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Available
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900">{room.type}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-normal">{room.description}</p>
                    
                    {isSoldOut && (
                      <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-xl text-[11px] text-rose-800 font-semibold flex items-center gap-1.5 mt-2">
                        <AlertCircle size={14} className="text-rose-600 shrink-0" />
                        <span>All rooms in this category are fully booked.</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Rate / Night</span>
                      <span className="text-lg font-black text-slate-900">₹ {room.pricePerNight.toLocaleString('en-IN')}</span>
                    </div>

                    <button
                      disabled={isSoldOut}
                      onClick={() => !isSoldOut && navigate(`/book/${hotel.id || hotel.hotelId}/${room.id}`, { state: { hotel, room } })}
                      className={`px-4 py-2.5 font-semibold rounded-xl text-xs flex items-center space-x-1 shadow-xs transition-all ${
                        isSoldOut 
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300' 
                          : 'bg-[#7B1E3A] hover:bg-[#5C152C] text-white'
                      }`}
                    >
                      <span>{isSoldOut ? 'Sold Out' : 'Reserve'}</span>
                      {!isSoldOut && <ChevronRight size={14} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default HotelDetails;
