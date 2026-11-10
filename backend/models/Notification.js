import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  notificationId: { type: String, required: true, unique: true },
  recipientUserId: { type: String, default: null, index: true },
  recipientRole: { 
    type: String, 
    enum: ['customer', 'receptionist', 'manager', 'all'], 
    required: true,
    index: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['booking_created', 'booking_confirmed', 'booking_cancelled', 'check_in', 'check_out', 'maintenance', 'payment'], 
    default: 'booking_created' 
  },
  relatedBookingId: { type: String, default: null },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

