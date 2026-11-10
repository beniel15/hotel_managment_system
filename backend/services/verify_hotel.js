import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const hotelSchema = new mongoose.Schema({
  id: String,
  name: String,
  images: [String],
}, { strict: false });

const Hotel = mongoose.models.Hotel || mongoose.model('Hotel', hotelSchema);

async function checkHotels() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hoteldb');
    const hotels = await Hotel.find({});
    console.log('Total hotels in DB:', hotels.length);
    hotels.forEach(h => {
      console.log(`- ID: ${h.id || h.hotelId}, Name: "${h.name}"`);
      console.log('  Images:', h.images);
    });
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkHotels();
