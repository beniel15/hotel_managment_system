import mongoose from 'mongoose';

const HotelConfigSchema = new mongoose.Schema({
  hotelId: { type: String, default: 'single-hotel-saravana', unique: true },
  name: { type: String, default: 'Hotel Saravana Grand' },
  tagline: { type: String, default: 'Luxury Living & South Indian Vegetarian Hospitality' },
  city: { type: String, default: 'Madurai' },
  state: { type: String, default: 'Tamil Nadu' },
  country: { type: String, default: 'India' },
  locationAddress: { type: String, default: 'Mattuthavani Bus Stand Road, Near Periyar Bus Stand, Madurai, Tamil Nadu 625020' },
  phone: { type: String, default: '+91 452 234 5678' },
  email: { type: String, default: 'reservations@hotelsaravanagrand.com' },
  website: { type: String, default: 'https://hotelsaravanagrand.com' },
  rating: { type: Number, default: 4.8 },
  reviewsCount: { type: Number, default: 620 },
  description: { 
    type: String, 
    default: 'Iconic luxury hotel in Madurai offering exquisitely furnished air-conditioned chambers, authentic South Indian vegetarian fine dining, 24/7 dedicated room service, ergonomic workstations, and complimentary valet parking.' 
  },
  amenities: {
    type: [String],
    default: [
      'Free High-Speed Wi-Fi',
      'Central Air Conditioning',
      'South Indian Veg Fine Dining',
      '24/7 Front Desk & Concierge',
      'Free Valet Parking',
      'Ergonomic Work Desk',
      'Conference & Banquet Hall',
      'Daily Housekeeping'
    ]
  },
  images: {
    type: [String],
    default: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80'
    ]
  },
  checkInTime: { type: String, default: '12:00 PM' },
  checkOutTime: { type: String, default: '11:00 AM' },
  cancellationPolicy: { 
    type: String, 
    default: 'Free cancellation up to 24 hours prior to check-in. Cancellations made within 24 hours incur a 1-night retention fee.' 
  },
  taxRatePercent: { type: Number, default: 12 }
}, { timestamps: true });

export default mongoose.models.HotelConfig || mongoose.model('HotelConfig', HotelConfigSchema);

