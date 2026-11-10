import mongoose from 'mongoose';

const RoomTypeSchema = new mongoose.Schema({
  typeId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  occupancy: { type: Number, required: true, min: 1, max: 8 },
  bedType: { type: String, default: '1 King Bed' },
  pricePerNight: { type: Number, required: true, min: 0 },
  amenities: [{ type: String }],
  images: [{ type: String }],
  totalInventory: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.models.RoomType || mongoose.model('RoomType', RoomTypeSchema);
