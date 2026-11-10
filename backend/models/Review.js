import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
  reviewId: { type: String, required: true, unique: true },
  bookingId: { type: String, required: true, unique: true }, // 1 review per booking
  userId: { type: String, required: true, index: true },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  roomTypeName: { type: String, default: '' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.models.Review || mongoose.model('Review', ReviewSchema);
