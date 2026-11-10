import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  uid: { type: String, default: function() { return this.userId; } },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['customer', 'manager', 'receptionist'], 
    default: 'customer' 
  },
  phone: { type: String, default: '+91 98765 43210' },
  photoURL: { type: String },
  isActive: { type: Boolean, default: true },
  assignedShift: { type: String, default: 'General' }, // For staff
  notes: { type: String }
}, { timestamps: true });

// Pre-save hook to hash password if modified
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Instance method to compare password
UserSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.models.User || mongoose.model('User', UserSchema);
