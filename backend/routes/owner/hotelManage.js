import express from 'express';
import Hotel from '../../models/Hotel.js';

const router = express.Router();

// Owner: Add new Hotel Property
router.post('/hotels', async (req, res) => {
  try {
    const hotelData = req.body;
    const hotelId = hotelData.hotelId || hotelData.id || ('h-' + Math.floor(100 + Math.random() * 900));

    const newHotel = await Hotel.create({
      hotelId,
      ...hotelData,
      location: {
        type: 'Point',
        coordinates: [hotelData.lng || 78.1198, hotelData.lat || 9.9252]
      },
      status: 'approved'
    });

    res.status(201).json({ success: true, hotel: newHotel });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Owner: Get hotels owned by partner
router.get('/hotels', async (req, res) => {
  try {
    const { ownerId } = req.query;
    const query = ownerId ? { ownerId } : {};
    const hotels = await Hotel.find(query).lean();
    res.json(hotels);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Owner: Delete hotel property by ID
router.delete('/hotels/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Hotel.deleteOne({ $or: [{ hotelId: id }, { id: id }] });
    res.json({ success: true, message: 'Hotel property deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Owner: Update hotel property & room details
router.put('/hotels/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const updatedHotel = await Hotel.findOneAndUpdate(
      { $or: [{ hotelId: id }, { id: id }] },
      { $set: updateData },
      { new: true }
    );
    res.json({ success: true, hotel: updatedHotel });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
