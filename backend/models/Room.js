import mongoose from 'mongoose';

const RoomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  roomNumber: { type: String, required: true, unique: true }, // e.g., '101', '102', '201'
  floor: { type: Number, required: true },
  typeId: { type: String, required: true, ref: 'RoomType' },
  typeName: { type: String, required: true },
  capacity: { type: Number, default: 2 },
  status: { 
    type: String, 
    enum: ['Available', 'Reserved', 'Occupied', 'Cleaning', 'Under Maintenance'], 
    default: 'Available' 
  },
  currentBookingId: { type: String, default: null },
  lastCleanedAt: { type: Date, default: Date.now },
  maintenanceNotes: { type: String, default: '' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

RoomSchema.index({ typeId: 1, status: 1 });
RoomSchema.index({ floor: 1 });

export default mongoose.models.Room || mongoose.model('Room', RoomSchema);
