import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  await mongoose.connection.db.collection('hotels').updateOne(
    { hotelId: 'h-saravana-bhavan' },
    { $set: { "images.0": 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80' } }
  );
  console.log('Successfully updated Hotel Saravana Bhavan image in MongoDB Atlas Cloud!');
  mongoose.disconnect();
}).catch(err => {
  console.error('Atlas update error:', err);
  process.exit(1);
});
