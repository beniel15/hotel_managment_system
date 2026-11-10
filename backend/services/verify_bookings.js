import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const bookingSchema = new mongoose.Schema({
  bookingId: String,
  guestName: String,
  guestEmail: String,
  guestPhone: String,
  hotelName: String,
}, { strict: false });

const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);

async function checkBookings() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hoteldb');
    const bookings = await Booking.find({});
    console.log('Total bookings in MongoDB Atlas:', bookings.length);
    bookings.forEach(b => {
      console.log(`- ${b.bookingId || b._id}: Guest Name = "${b.guestName}", Email = "${b.guestEmail}"`);
    });
    process.exit(0);
  } catch (err) {
    console.error('Error connecting/fetching:', err);
    process.exit(1);
  }
}

checkBookings();
