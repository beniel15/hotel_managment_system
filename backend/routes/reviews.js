import express from 'express';
import Review from '../models/Review.js';
import Booking from '../models/Booking.js';
import { memoryStore } from '../services/dataRepository.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 1. GET ALL REVIEWS WITH STATISTICAL AGGREGATION (Public)
router.get('/', async (req, res) => {
  try {
    let reviews = [];
    try {
      reviews = await Review.find().sort({ createdAt: -1 }).lean();
    } catch (e) {
      reviews = memoryStore.reviews;
    }
    if (!reviews.length) reviews = memoryStore.reviews;

    const totalReviews = reviews.length;
    const avgRating = totalReviews > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
      : '5.0';

    const distribution = {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length
    };

    res.json({
      success: true,
      stats: {
        averageRating: Number(avgRating),
        totalReviews,
        distribution
      },
      reviews
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. SUBMIT REVIEW (Customer only, must have Completed booking)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body;

    if (!bookingId || !rating || !comment) {
      return res.status(400).json({ success: false, message: 'bookingId, rating (1-5), and comment are required.' });
    }

    const numRating = Number(rating);
    if (numRating < 1 || numRating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
    }

    // Check if review already exists for this booking
    let existingReview = memoryStore.reviews.find(r => r.bookingId === bookingId);
    if (!existingReview) {
      try {
        existingReview = await Review.findOne({ bookingId });
      } catch (e) {}
    }
    if (existingReview) {
      return res.status(409).json({ success: false, message: 'You have already submitted a review for this completed reservation.' });
    }

    // Verify booking belongs to this user and is Completed
    let booking = memoryStore.bookings.find(b => b.bookingId === bookingId);
    if (!booking) {
      try {
        booking = await Booking.findOne({ bookingId });
      } catch (e) {}
    }

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking reference not found.' });
    }

    // Check ownership
    const isOwner = booking.userId === req.user.userId || booking.customerEmail?.toLowerCase() === req.user.email.toLowerCase();
    if (!isOwner) {
      return res.status(403).json({ success: false, message: 'You can only review bookings made under your own account.' });
    }

    // Check status: only completed stays can be reviewed
    if (booking.bookingStatus !== 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Reviews can only be submitted after check-out is completed. Current booking status: ' + booking.bookingStatus
      });
    }

    const newReview = {
      reviewId: 'REV-' + Math.floor(1000 + Math.random() * 9000),
      bookingId,
      userId: req.user.userId,
      userName: req.user.name || booking.customerName,
      userEmail: req.user.email,
      roomTypeName: booking.roomTypeName || 'Deluxe Room',
      rating: numRating,
      comment: comment.trim(),
      createdAt: new Date()
    };

    try {
      await Review.create(newReview);
    } catch (e) {
      console.warn('DB Review create notice:', e.message);
    }
    memoryStore.reviews.unshift({ ...newReview });

    res.status(201).json({
      success: true,
      message: 'Thank you for your feedback! Your review has been published.',
      review: newReview
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

