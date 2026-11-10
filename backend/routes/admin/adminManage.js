import express from 'express';
import Hotel from '../../models/Hotel.js';
import Booking from '../../models/Booking.js';
import User from '../../models/User.js';

const router = express.Router();

// Admin: System statistics
router.get('/stats', async (req, res) => {
  try {
    const totalHotels = await Hotel.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const totalUsers = await User.countDocuments();
    
    const bookings = await Booking.find().lean();
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    res.json({
      totalHotels,
      totalBookings,
      totalUsers,
      totalRevenue,
      systemCapacity: '100+ Concurrent Users'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Get all hotels for approval
router.get('/hotels', async (req, res) => {
  try {
    const hotels = await Hotel.find().lean();
    res.json(hotels);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
