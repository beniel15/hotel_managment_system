import mongoose from 'mongoose';

const RoomAllocationSchema = new mongoose.Schema({
  allocationId: { type: String, required: true },
  typeId: { type: String, required: true },
  typeName: { type: String, required: true },
  roomNumber: { type: String, default: null }, // e.g. '101'
  floor: { type: Number, default: 1 },
  pricePerNight: { type: Number, default: 0 },
  checkInStatus: { 
    type: String, 
    enum: ['Pending', 'Checked-In', 'Checked-Out'], 
    default: 'Pending' 
  },
  checkInTime: { type: Date, default: null },
  checkOutTime: { type: Date, default: null }
}, { _id: false });

const BookingSchema = new mongoose.Schema({
  bookingId: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true, lowercase: true, index: true },
  customerPhone: { type: String, required: true },
  
  // Primary Room Type (for single room bookings or primary category)
  typeId: { type: String, required: true },
  roomTypeName: { type: String, required: true },
  assignedRoomNumber: { type: String, default: null }, // e.g. '101' or '101, 102'
  preferredFloor: { type: mongoose.Schema.Types.Mixed, default: 'any' },
  assignedFloor: { type: Number, default: 1 },

  // Multi-room / Group Booking Allocations
  roomsCount: { type: Number, default: 1, min: 1 },
  roomAllocations: [RoomAllocationSchema],

  // Dates & Times
  checkInDate: { type: String, required: true }, // Format: 'YYYY-MM-DD'
  checkOutDate: { type: String, required: true }, // Format: 'YYYY-MM-DD'
  checkInTimeStr: { type: String, default: '12:00 PM' },
  checkOutTimeStr: { type: String, default: '11:00 AM' },
  
  // Stay Package
  stayPackage: { 
    type: String, 
    enum: ['standard_overnight', 'day_stay', 'full_24h', 'NIGHT', 'DAY', 'FULL_DAY'], 
    default: 'standard_overnight' 
  },
  stayTypeName: { type: String, default: 'Standard Overnight (12:00 PM - 11:00 AM)' },
  numberOfNights: { type: Number, required: true, min: 1 },
  
  // Guest Breakdown
  numberOfGuests: { type: Number, required: true, min: 1 },
  adultsCount: { type: Number, default: 2 },
  childrenCount: { type: Number, default: 0 },

  // Financial Breakdown
  pricePerNight: { type: Number, required: true },
  roomTotal: { type: Number, required: true },
  tax: { type: Number, required: true },
  additionalCharges: { type: Number, default: 0 },
  additionalChargesDescription: { type: String, default: '' },
  totalAmount: { type: Number, required: true },
  
  paymentStatus: { 
    type: String, 
    enum: ['Pending', 'Paid', 'Refunded'], 
    default: 'Paid' 
  },
  paymentMethod: { type: String, default: 'Razorpay' },
  transactionId: { type: String, default: '' },
  bookingStatus: { 
    type: String, 
    enum: ['Pending', 'Confirmed', 'Checked-In', 'Completed', 'Cancelled', 'Rejected'], 
    default: 'Confirmed',
    index: true
  },
  specialRequests: { type: String, default: '' },
  isWalkIn: { type: Boolean, default: false },
  bookedByRole: { type: String, enum: ['customer', 'receptionist', 'manager'], default: 'customer' },
  checkInTime: { type: Date, default: null },
  checkOutTime: { type: Date, default: null },
  cancellationReason: { type: String, default: '' },
  cancelledAt: { type: Date, default: null }
}, { timestamps: true });

// Compound indexes for date range overlap queries
BookingSchema.index({ assignedRoomNumber: 1, checkInDate: 1, checkOutDate: 1, bookingStatus: 1 });
BookingSchema.index({ typeId: 1, checkInDate: 1, checkOutDate: 1, bookingStatus: 1 });
BookingSchema.index({ 'roomAllocations.roomNumber': 1, checkInDate: 1, checkOutDate: 1 });

export default mongoose.models.Booking || mongoose.model('Booking', BookingSchema);
