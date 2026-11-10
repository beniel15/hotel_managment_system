import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const bookings = await mongoose.connection.db.collection('bookings').find({ guestName: /Test/i }).toArray();
  console.log('Found bookings with (Test) in name:', bookings.length);
  for (const b of bookings) {
    const cleanName = b.guestName.replace(/\s*\(Test\)/gi, '').replace(/Test\s*/gi, '').trim();
    await mongoose.connection.db.collection('bookings').updateOne(
      { _id: b._id },
      { $set: { guestName: cleanName } }
    );
    console.log(`Cleaned booking ${b.bookingId}: '${b.guestName}' -> '${cleanName}'`);
  }
  console.log('All (Test) guest names removed successfully from MongoDB Atlas!');
  mongoose.disconnect();
}).catch(err => {
  console.error('Clean error:', err);
  process.exit(1);
});
