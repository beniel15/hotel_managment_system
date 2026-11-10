import express from 'express';
import Booking from '../../models/Booking.js';

const router = express.Router();

// Owner: Get all room reservations for owner's properties
router.get('/bookings', async (req, res) => {
  try {
    const { ownerId, ownerEmail } = req.query;
    let query = {};
    if (ownerId || ownerEmail) {
      query = {
        $or: [
          { ownerId: ownerId },
          { ownerEmail: ownerEmail },
          { ownerId: 'saravanabhavan' },
          { hotelId: 'h-saravana-bhavan' }
        ]
      };
    }
    const bookings = await Booking.find(query).sort({ createdAt: -1 }).lean();
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
