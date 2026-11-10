import express from 'express';
import Hotel from '../../models/Hotel.js';

const router = express.Router();

// GET /api/hotels?destination=West Avani Moola Street
router.get('/', async (req, res) => {
  try {
    const { city, destination } = req.query;
    const searchTerm = (destination || city || '').trim();

    let query = { status: 'approved' };
    let hotels = [];

    if (searchTerm !== '') {
      const sanitizedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(sanitizedTerm, 'i');

      // Search across address / locationName, city, and hotel name
      query.$or = [
        { locationName: regex },
        { city: regex },
        { name: regex },
        { description: regex }
      ];

      hotels = await Hotel.find(query).lean();

      // If no phrase match, try individual location keywords (e.g. "Avani", "Temple")
      if (!hotels.length) {
        const words = searchTerm.split(/\s+/).filter(w => w.length >= 3);
        if (words.length > 0) {
          const wordRegexes = words.map(w => new RegExp(w, 'i'));
          query.$or = wordRegexes.flatMap(r => [
            { locationName: r },
            { city: r },
            { name: r }
          ]);
          hotels = await Hotel.find(query).lean();
        }
      }
    } else {
      // If no destination specified, return all approved hotels
      hotels = await Hotel.find({ status: 'approved' }).lean();
    }

    res.json(hotels);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



// GET /api/hotels/:id
router.get('/:id', async (req, res) => {
  try {
    const hotel = await Hotel.findOne({ hotelId: req.params.id }).lean();
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }
    res.json(hotel);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
