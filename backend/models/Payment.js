import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema({
  paymentId: { type: String, required: true, unique: true },
  bookingId: { type: String, required: true, index: true },
  userId: { type: String, required: true },
  customerName: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  method: { type: String, required: true }, // 'Razorpay', 'Cash', 'Card', 'UPI'
  status: { 
    type: String, 
    enum: ['Completed', 'Pending', 'Failed', 'Refunded'], 
    default: 'Completed' 
  },
  transactionReference: { type: String, required: true },
  notes: { type: String, default: '' },
  paidAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);

