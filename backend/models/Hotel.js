import mongoose from 'mongoose';

const RoomSubSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, required: true },
  occupancy: { type: Number, required: true },
  pricePerNight: { type: Number, required: true },
  available: { type: Number, default: 5 },
  description: { type: String },
  amenities: [{ type: String }]
}, { _id: false });

const HotelSchema = new mongoose.Schema({
  hotelId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  city: { type: String, required: true },
  locationName: { type: String, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }
  },
  rating: { type: Number, default: 4.8 },
  reviewsCount: { type: Number, default: 150 },
  images: [{ type: String }],
  description: { type: String, required: true },
  amenities: [{ type: String }],
  ownerId: { type: String, required: true },
  ownerName: { type: String, default: 'Hotel Partner' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
  rooms: [RoomSubSchema]
}, { timestamps: true });

HotelSchema.index({ location: '2dsphere' });

export default mongoose.models.Hotel || mongoose.model('Hotel', HotelSchema);
