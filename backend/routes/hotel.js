import express from 'express';
import HotelConfig from '../models/HotelConfig.js';
import { memoryStore, INITIAL_HOTEL_DATA } from '../services/dataRepository.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// 1. GET SINGLE HOTEL DETAILS (Public)
router.get('/', async (req, res) => {
  try {
    let hotel = null;
    try {
      hotel = await HotelConfig.findOne();
    } catch (e) {
      hotel = memoryStore.hotel;
    }

    if (!hotel) {
      hotel = memoryStore.hotel || INITIAL_HOTEL_DATA;
    }

    res.json({ success: true, hotel });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. UPDATE HOTEL CONFIGURATION & POLICIES (Manager only)
router.put('/', authenticateToken, requireRole(['manager']), async (req, res) => {
  try {
    const updateData = req.body;
    let updatedHotel = null;

    try {
      updatedHotel = await HotelConfig.findOneAndUpdate(
        {},
        { $set: updateData },
        { new: true, upsert: true }
      );
    } catch (e) {
      console.warn('DB hotel update fallback:', e.message);
    }

    memoryStore.hotel = { ...memoryStore.hotel, ...updateData };
    if (!updatedHotel) updatedHotel = memoryStore.hotel;

    res.json({
      success: true,
      message: 'Hotel information and policies updated successfully.',
      hotel: updatedHotel
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

