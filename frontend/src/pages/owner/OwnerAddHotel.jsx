import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getLocalHotels, saveLocalHotels } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Building2, MapPin, Navigation, Plus, ArrowLeft, Loader2 } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const OwnerAddHotel = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [name, setName] = useState('');
  const [city, setCity] = useState('Madurai');
  const [locationName, setLocationName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80');

  const [room1Price, setRoom1Price] = useState(2499);
  const [room1Available, setRoom1Available] = useState(5);

  const [room2Price, setRoom2Price] = useState(4299);
  const [room2Available, setRoom2Available] = useState(8);

  const [room3Price, setRoom3Price] = useState(6499);
  const [room3Available, setRoom3Available] = useState(4);

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const ownerId = currentUser?.uid || currentUser?.email || 'owner-mdu-1';
    const newHotelId = 'h-' + Math.floor(100 + Math.random() * 900);

    const newHotel = {
      id: newHotelId,
      hotelId: newHotelId,
      name,
      city: city || 'Madurai',
      locationName: locationName || `${city}, Tamil Nadu`,
      lat: 9.9252,
      lng: 78.1198,
      rating: 4.8,
      reviewsCount: 1,
      images: [imageUrl],
      description: description || 'Luxury hotel offering fine dining, AC rooms, and modern amenities.',
      amenities: ['Free High-Speed Wi-Fi', 'Swimming Pool', 'Breakfast Included', '24/7 Room Service'],
      ownerId: ownerId,
      ownerName: currentUser?.displayName || currentUser?.email || 'Hotel Owner Partner',
      status: 'approved',
      rooms: [
        {
          id: `r-${newHotelId}-1`,
          type: 'Single Occupancy Deluxe',
          occupancy: 1,
          pricePerNight: parseFloat(room1Price),
          available: parseInt(room1Available),
          description: 'Single guest room with work desk & breakfast.',
          amenities: ['King Bed', 'AC', 'Wi-Fi']
        },
        {
          id: `r-${newHotelId}-2`,
          type: 'Double Occupancy Executive Suite',
          occupancy: 2,
          pricePerNight: parseFloat(room2Price),
          available: parseInt(room2Available),
          description: 'Spacious double occupancy suite.',
          amenities: ['2 Queen Beds', 'AC', 'Breakfast']
        },
        {
          id: `r-${newHotelId}-3`,
          type: 'Triple Occupancy Family Villa',
          occupancy: 3,
          pricePerNight: parseFloat(room3Price),
          available: parseInt(room3Available),
          description: 'Premium family villa for 3 guests.',
          amenities: ['3 Beds', 'Lounge']
        }
      ]
    };

    try {
      await axios.post(`${API_BASE_URL}/owner/hotels`, newHotel);
    } catch (err) {
      console.warn("Backend hotel registration notice:", err);
    } finally {
      const existingHotels = getLocalHotels();
      saveLocalHotels([newHotel, ...existingHotels]);
      setSubmitting(false);
      navigate('/owner/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F3F4] text-slate-900 pb-20 font-sans">
      
      <div className="bg-white border-b border-slate-200/80 py-4 px-4 sm:px-6 lg:px-8 shadow-xs">
        <div className="max-w-3xl mx-auto flex items-center justify-between text-xs">
          <button onClick={() => navigate('/owner/dashboard')} className="flex items-center space-x-1.5 font-semibold text-[#7B1E3A] hover:underline">
            <ArrowLeft size={16} />
            <span>Back to Owner Dashboard</span>
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="mb-6 text-center space-y-1">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Register New Hotel Property</h1>
          <p className="text-xs text-slate-500 font-normal">Owner Account: <strong>{currentUser?.email || 'owner@luxstay.com'}</strong></p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
          
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[#7B1E3A] uppercase tracking-wider">1. Basic Property Details</h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hotel Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Royal Thirupathi Grand Resort"
                className="w-full bg-[#f8fafc] border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7B1E3A]/20 focus:border-[#7B1E3A]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Madurai"
                  className="w-full bg-[#f8fafc] border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7B1E3A]/20 focus:border-[#7B1E3A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Location Address</label>
                <input
                  type="text"
                  required
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="e.g. West Avani Moola Street, Madurai"
                  className="w-full bg-[#f8fafc] border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7B1E3A]/20 focus:border-[#7B1E3A]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your hotel property, location, and guest amenities..."
                className="w-full bg-[#f8fafc] border border-slate-200/80 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7B1E3A]/20 focus:border-[#7B1E3A]"
              />
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-200/80">
            <h3 className="text-xs font-bold text-[#7B1E3A] uppercase tracking-wider">2. Room Rates (1, 2, 3 Occupancy)</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-[#f8fafc] p-3.5 rounded-xl border border-slate-200/80 space-y-2">
                <div className="text-xs font-semibold text-slate-800">1 Occupancy</div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-medium mb-1">Price / Night (₹)</label>
                  <input type="number" value={room1Price} onChange={(e) => setRoom1Price(e.target.value)} className="w-full bg-white border border-slate-200/80 rounded-lg p-2 text-xs font-bold focus:outline-none focus:border-[#7B1E3A]" />
                </div>
              </div>

              <div className="bg-[#f8fafc] p-3.5 rounded-xl border border-slate-200/80 space-y-2">
                <div className="text-xs font-semibold text-slate-800">2 Occupancy</div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-medium mb-1">Price / Night (₹)</label>
                  <input type="number" value={room2Price} onChange={(e) => setRoom2Price(e.target.value)} className="w-full bg-white border border-slate-200/80 rounded-lg p-2 text-xs font-bold focus:outline-none focus:border-[#7B1E3A]" />
                </div>
              </div>

              <div className="bg-[#f8fafc] p-3.5 rounded-xl border border-slate-200/80 space-y-2">
                <div className="text-xs font-semibold text-slate-800">3 Occupancy</div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-medium mb-1">Price / Night (₹)</label>
                  <input type="number" value={room3Price} onChange={(e) => setRoom3Price(e.target.value)} className="w-full bg-white border border-slate-200/80 rounded-lg p-2 text-xs font-bold focus:outline-none focus:border-[#7B1E3A]" />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-[#7B1E3A] hover:bg-[#5C152C] text-white font-semibold rounded-xl text-xs shadow-xs transition-all flex items-center justify-center space-x-1.5"
          >
            {submitting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <Plus size={16} />
                <span>Register & Publish Property</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OwnerAddHotel;
