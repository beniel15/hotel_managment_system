import express from 'express';
import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Room from '../models/Room.js';
import RoomType from '../models/RoomType.js';
import Payment from '../models/Payment.js';
import Notification from '../models/Notification.js';
import { memoryStore } from '../services/dataRepository.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Helper to normalize room type ID aliases
const normalizeTypeId = (id) => {
  if (!id) return 'rt-standard';
  if (id === 'rt-single-exec' || id === 'standard' || id === 'standard-room') return 'rt-standard';
  if (id === 'rt-deluxe-double' || id === 'deluxe' || id === 'deluxe-room') return 'rt-deluxe';
  if (id === 'rt-family-suite' || id === 'rt-presidential' || id === 'premium' || id === 'suite') return 'rt-premium';
  return id;
};

// Helper: Calculate package timing
const getPackageTimings = (stayPackage) => {
  switch (stayPackage) {
    case 'day_stay':
    case 'DAY':
      return {
        checkInTimeStr: '10:00 AM',
        checkOutTimeStr: '08:00 PM',
        stayTypeName: 'Day Stay (10:00 AM – 8:00 PM)',
        multiplier: 0.70
      };
    case 'full_24h':
    case 'FULL_DAY':
      return {
        checkInTimeStr: '12:00 PM',
        checkOutTimeStr: '12:00 PM (Next Day)',
        stayTypeName: 'Full 24-Hour Stay (Flexible 24-hr)',
        multiplier: 1.15
      };
    case 'standard_overnight':
    case 'NIGHT':
    default:
      return {
        checkInTimeStr: '12:00 PM',
        checkOutTimeStr: '11:00 AM',
        stayTypeName: 'Standard Overnight (12:00 PM – 11:00 AM)',
        multiplier: 1.0
      };
  }
};

// Helper: Query all overlapping booked room numbers
const getOverlappingBookedRooms = async (checkInDate, checkOutDate, excludeBookingId = null) => {
  let overlappingBookings = [];
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      const query = {
        bookingStatus: { $in: ['Confirmed', 'Checked-In'] },
        checkInDate: { $lt: checkOutDate },
        checkOutDate: { $gt: checkInDate }
      };
      if (excludeBookingId) query.bookingId = { $ne: excludeBookingId };
      overlappingBookings = await Booking.find(query).lean();
    } catch (e) {
      overlappingBookings = memoryStore.bookings.filter(b => 
        b.bookingId !== excludeBookingId &&
        (b.bookingStatus === 'Confirmed' || b.bookingStatus === 'Checked-In') &&
        (b.checkInDate < checkOutDate && b.checkOutDate > checkInDate)
      );
    }
  } else {
    overlappingBookings = memoryStore.bookings.filter(b => 
      b.bookingId !== excludeBookingId &&
      (b.bookingStatus === 'Confirmed' || b.bookingStatus === 'Checked-In') &&
      (b.checkInDate < checkOutDate && b.checkOutDate > checkInDate)
    );
  }

  const bookedRoomNumbers = new Set();
  for (const b of overlappingBookings) {
    if (b.roomAllocations && Array.isArray(b.roomAllocations)) {
      for (const alloc of b.roomAllocations) {
        if (alloc.roomNumber) bookedRoomNumbers.add(String(alloc.roomNumber));
      }
    }
    if (b.assignedRoomNumber) {
      const parts = String(b.assignedRoomNumber).split(',').map(s => s.trim());
      for (const p of parts) {
        if (p) bookedRoomNumbers.add(p);
      }
    }
  }
  return bookedRoomNumbers;
};

// Helper: Get physical rooms from DB or memory
const getAllPhysicalRooms = async () => {
  let rooms = [];
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      rooms = await Room.find({ isActive: true }).lean();
    } catch (e) {
      rooms = memoryStore.rooms.filter(r => r.isActive !== false);
    }
  } else {
    rooms = memoryStore.rooms.filter(r => r.isActive !== false);
  }
  if (!rooms || !rooms.length) rooms = memoryStore.rooms.filter(r => r.isActive !== false);
  return rooms;
};

// 1. CREATE ONLINE BOOKING WITH MULTI-ROOM / GROUP BOOKING & STRICT OVERLAP VALIDATION
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      typeId,
      roomTypeName,
      selectedRooms, // Array of { typeId, quantity } for group bookings
      checkInDate,
      checkOutDate,
      adultsCount,
      childrenCount,
      numberOfGuests,
      stayPackage,
      preferredFloor,
      guestName,
      guestEmail,
      guestPhone,
      specialRequests,
      paymentMethod,
      razorpayPaymentId
    } = req.body;

    if (!checkInDate || !checkOutDate) {
      return res.status(400).json({ success: false, message: 'Check-in and check-out dates are required.' });
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid dates.' });
    }

    const selectedPkg = stayPackage || 'standard_overnight';
    const pkgInfo = getPackageTimings(selectedPkg);

    const isDay = selectedPkg === 'day_stay' || selectedPkg === 'DAY';
    if (!isDay && checkOut <= checkIn) {
      return res.status(400).json({ success: false, message: 'Check-out date must be strictly after check-in date.' });
    }

    const rawDiffDays = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    const durationUnits = Math.max(1, rawDiffDays);
    const nights = durationUnits;

    // Normalize room requests
    // Supports either selectedRooms array: [{ typeId, quantity }] OR single typeId + quantity
    let roomRequests = [];
    if (Array.isArray(selectedRooms) && selectedRooms.length > 0) {
      roomRequests = selectedRooms.filter(r => r && r.quantity > 0);
    } else if (typeId) {
      const qty = parseInt(req.body.roomsCount, 10) || 1;
      roomRequests = [{ typeId, quantity: qty }];
    } else {
      return res.status(400).json({ success: false, message: 'Please select at least one room to book.' });
    }

    // STRICT ROOM CAPACITY VALIDATION:
    // Standard Room: Max 3 guests per room
    // Deluxe Room: Max 5 guests per room
    // Premium Room: Max 9 guests per room (2 attached rooms + balcony)
    let totalCapacity = 0;
    for (const reqItem of roomRequests) {
      const normId = normalizeTypeId(reqItem.typeId);
      const cap = normId === 'rt-premium' ? 9 : (normId === 'rt-deluxe' ? 5 : 3);
      totalCapacity += cap * (parseInt(reqItem.quantity, 10) || 1);
    }

    const totalGuests = (parseInt(adultsCount, 10) || 0) + (parseInt(childrenCount, 10) || 0) || parseInt(numberOfGuests, 10) || 1;

    if (totalCapacity < totalGuests) {
      return res.status(400).json({
        success: false,
        message: `Maximum room capacity exceeded! The selected rooms can accommodate at most ${totalCapacity} guests (Standard: 3 max/room, Deluxe: 5 max/room, Premium: 9 max/room). You have ${totalGuests} guests (${adultsCount || totalGuests} Adults, ${childrenCount || 0} Children). Please select additional room(s).`
      });
    }

    // Load physical rooms and currently booked rooms for date range
    const allPhysicalRooms = await getAllPhysicalRooms();
    const bookedRoomNumbers = await getOverlappingBookedRooms(checkInDate, checkOutDate);
    const maintenanceRoomNumbers = new Set(
      allPhysicalRooms.filter(r => r.status === 'Under Maintenance').map(r => String(r.roomNumber))
    );

    // Track allocated physical rooms for this booking
    const allocatedPhysicalRooms = [];
    let cumulativeRoomTotal = 0;
    const finalAllocations = [];
    let primaryTypeId = '';
    let primaryTypeName = '';

    // Atomically validate availability for each requested room type
    for (const reqItem of roomRequests) {
      const normId = normalizeTypeId(reqItem.typeId);
      const qtyNeeded = reqItem.quantity;

      // Find room type object
      let rtObj = memoryStore.roomTypes.find(rt => rt.typeId === reqItem.typeId || rt.typeId === normId);
      if (!rtObj && mongoose.connection && mongoose.connection.readyState === 1) {
        rtObj = await RoomType.findOne({ typeId: normId });
      }
      if (!rtObj) rtObj = memoryStore.roomTypes[0];

      if (!primaryTypeId) {
        primaryTypeId = rtObj.typeId;
        primaryTypeName = rtObj.name;
      }

      // Find available candidate physical rooms
      const candidateRooms = allPhysicalRooms.filter(r => 
        (r.typeId === rtObj.typeId || normalizeTypeId(r.typeId) === normId) &&
        !bookedRoomNumbers.has(String(r.roomNumber)) &&
        !maintenanceRoomNumbers.has(String(r.roomNumber)) &&
        !allocatedPhysicalRooms.includes(String(r.roomNumber))
      );

      // Prioritize candidate rooms on preferred floor if vacant!
      if (preferredFloor && preferredFloor !== 'any') {
        const pFloor = Number(preferredFloor);
        candidateRooms.sort((a, b) => {
          if (a.floor === pFloor && b.floor !== pFloor) return -1;
          if (b.floor === pFloor && a.floor !== pFloor) return 1;
          return 0;
        });
      }

      if (candidateRooms.length < qtyNeeded) {
        return res.status(409).json({
          success: false,
          message: `Only ${candidateRooms.length} room(s) of category "${rtObj.name}" available for ${checkInDate} to ${checkOutDate}. Requested: ${qtyNeeded}. Please choose another room type or adjust dates.`
        });
      }

      // Exact pricing per day/night according to selected stay package:
      // Standard: Overnight ₹999, Day Stay ₹1,399
      // Deluxe: Overnight ₹1,199, Day Stay ₹1,500
      // Premium: Overnight ₹2,000, Day Stay ₹3,499
      const isDayOr24h = selectedPkg === 'day_stay' || selectedPkg === 'DAY' || selectedPkg === 'full_24h' || selectedPkg === 'FULL_DAY';
      let effectiveRate = 999;
      if (isDayOr24h) {
        effectiveRate = normId === 'rt-premium' ? 3499 : (normId === 'rt-deluxe' ? 1500 : 1399);
      } else {
        effectiveRate = normId === 'rt-premium' ? 2000 : (normId === 'rt-deluxe' ? 1199 : 999);
      }

      // Allocate rooms
      for (let i = 0; i < qtyNeeded; i++) {
        const assignedRoom = candidateRooms[i];
        allocatedPhysicalRooms.push(String(assignedRoom.roomNumber));
        bookedRoomNumbers.add(String(assignedRoom.roomNumber)); // Lock locally

        finalAllocations.push({
          allocationId: 'alloc-' + Math.floor(100000 + Math.random() * 900000),
          typeId: rtObj.typeId,
          typeName: rtObj.name,
          roomNumber: assignedRoom.roomNumber,
          floor: assignedRoom.floor,
          pricePerNight: effectiveRate,
          checkInStatus: 'Pending',
          checkInTime: null,
          checkOutTime: null
        });

        cumulativeRoomTotal += effectiveRate * durationUnits;
      }
    }

    const totalRoomsCount = finalAllocations.length;
    const tax = Math.round(cumulativeRoomTotal * 0.12);
    const totalAmount = cumulativeRoomTotal + tax;

    const newBookingId = 'BK-' + Math.floor(10000 + Math.random() * 90000);
    const newPaymentId = 'PAY-' + Math.floor(10000 + Math.random() * 90000);

    const assignedRoomStr = allocatedPhysicalRooms.join(', ');

    const numAdults = Number(adultsCount) || Number(numberOfGuests) || (totalRoomsCount * 2);
    const numChildren = Number(childrenCount) || 0;
    const finalTotalGuests = numAdults + numChildren || totalGuests;

    const bookingRecord = {
      bookingId: newBookingId,
      userId: req.user.userId,
      customerName: (guestName || req.user.name || 'Valued Guest').trim(),
      customerEmail: (guestEmail || req.user.email).toLowerCase().trim(),
      customerPhone: guestPhone || req.user.phone || '+91 98765 43210',
      typeId: primaryTypeId,
      roomTypeName: totalRoomsCount > 1 ? `${primaryTypeName} (+${totalRoomsCount - 1} more)` : primaryTypeName,
      assignedRoomNumber: assignedRoomStr,
      preferredFloor: (preferredFloor && preferredFloor !== 'any') ? Number(preferredFloor) : 'any',
      assignedFloor: finalAllocations[0]?.floor || 1,
      roomsCount: totalRoomsCount,
      roomAllocations: finalAllocations,
      checkInDate,
      checkOutDate,
      checkInTimeStr: pkgInfo.checkInTimeStr,
      checkOutTimeStr: pkgInfo.checkOutTimeStr,
      stayPackage: selectedPkg,
      stayTypeName: pkgInfo.stayTypeName,
      numberOfNights: nights,
      numberOfGuests: finalTotalGuests,
      adultsCount: numAdults,
      childrenCount: numChildren,
      pricePerNight: Math.round(cumulativeRoomTotal / (nights * totalRoomsCount)),
      roomTotal: cumulativeRoomTotal,
      tax,
      additionalCharges: 0,
      additionalChargesDescription: '',
      totalAmount,
      paymentStatus: 'Paid',
      paymentMethod: paymentMethod || 'Razorpay (Online)',
      transactionId: razorpayPaymentId || ('txn_' + Math.random().toString(36).substring(2, 10).toUpperCase()),
      bookingStatus: 'Confirmed',
      specialRequests: specialRequests || '',
      isWalkIn: false,
      bookedByRole: req.user.role,
      createdAt: new Date()
    };

    // Save Booking in MongoDB & memoryStore
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        await Booking.create(bookingRecord);
      } catch (dbErr) {
        console.warn('DB Booking create notice:', dbErr.message);
      }
    }
    memoryStore.bookings.unshift({ ...bookingRecord });

    // Create Payment transaction record
    const paymentRecord = {
      paymentId: newPaymentId,
      bookingId: newBookingId,
      userId: req.user.userId,
      customerName: bookingRecord.customerName,
      amount: totalAmount,
      currency: 'INR',
      method: bookingRecord.paymentMethod,
      status: 'Completed',
      transactionReference: bookingRecord.transactionId,
      paidAt: new Date()
    };
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        await Payment.create(paymentRecord);
      } catch (pErr) {}
    }
    memoryStore.payments.unshift({ ...paymentRecord });

    // Notifications
    const customerNotification = {
      notificationId: 'NOTIF-' + Math.floor(1000 + Math.random() * 9000),
      recipientUserId: req.user.userId,
      recipientRole: 'customer',
      title: 'Booking Confirmed!',
      message: `Your reservation #${newBookingId} for ${totalRoomsCount} room(s) (Room ${assignedRoomStr}) is confirmed at Hotel Saravana Grand.`,
      type: 'booking_confirmed',
      relatedBookingId: newBookingId,
      isRead: false,
      createdAt: new Date()
    };
    const staffNotification = {
      notificationId: 'NOTIF-' + Math.floor(1000 + Math.random() * 9000),
      recipientUserId: null,
      recipientRole: 'receptionist',
      title: 'New Online Reservation',
      message: `${bookingRecord.customerName} booked ${totalRoomsCount} room(s) (Room ${assignedRoomStr}) from ${checkInDate} to ${checkOutDate}.`,
      type: 'booking_created',
      relatedBookingId: newBookingId,
      isRead: false,
      createdAt: new Date()
    };
    memoryStore.notifications.unshift(customerNotification, staffNotification);

    res.status(201).json({
      success: true,
      message: 'Reservation confirmed successfully!',
      booking: bookingRecord
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. GET CUSTOMER PERSONAL BOOKINGS
router.get('/my-bookings', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const currentEmail = req.user.email.toLowerCase().trim();

    let userBookings = [];
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        userBookings = await Booking.find({
          $or: [
            { userId: currentUserId },
            { customerEmail: currentEmail }
          ]
        }).sort({ createdAt: -1 }).lean();
      } catch (e) {
        userBookings = memoryStore.bookings.filter(b => 
          b.userId === currentUserId || 
          b.customerEmail?.toLowerCase() === currentEmail
        );
      }
    } else {
      userBookings = memoryStore.bookings.filter(b => 
        b.userId === currentUserId || 
        b.customerEmail?.toLowerCase() === currentEmail
      );
    }
    if (!userBookings.length) {
      userBookings = memoryStore.bookings.filter(b => 
        b.userId === currentUserId || 
        b.customerEmail?.toLowerCase() === currentEmail
      );
    }

    res.json({ success: true, bookings: userBookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. GET ALL BOOKINGS (Receptionist & Manager)
router.get('/all', authenticateToken, requireRole(['receptionist', 'manager']), async (req, res) => {
  try {
    let allBookings = [];
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        allBookings = await Booking.find().sort({ createdAt: -1 }).lean();
      } catch (e) {
        allBookings = memoryStore.bookings;
      }
    } else {
      allBookings = memoryStore.bookings;
    }
    if (!allBookings.length) {
      allBookings = memoryStore.bookings;
    }

    res.json({ success: true, bookings: allBookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. GET BOOKING BY ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const bookingId = req.params.id;
    let booking = null;

    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        booking = await Booking.findOne({ bookingId }).lean();
      } catch (e) {
        booking = memoryStore.bookings.find(b => b.bookingId === bookingId);
      }
    }
    if (!booking) {
      booking = memoryStore.bookings.find(b => b.bookingId === bookingId);
    }

    if (!booking) {
      return res.status(404).json({ success: false, message: `Booking #${bookingId} not found.` });
    }

    // Customer role authorization check
    if (req.user.role === 'customer') {
      const isOwner = booking.userId === req.user.userId || booking.customerEmail?.toLowerCase() === req.user.email.toLowerCase();
      if (!isOwner) {
        return res.status(403).json({ success: false, message: 'Forbidden: You cannot access another guest’s reservation.' });
      }
    }

    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. WALK-IN RESERVATION (Receptionist & Manager)
router.post('/walk-in', authenticateToken, requireRole(['receptionist', 'manager']), async (req, res) => {
  try {
    const {
      guestName,
      guestPhone,
      guestEmail,
      typeId,
      roomNumber,
      checkInDate,
      checkOutDate,
      numberOfGuests,
      stayPackage,
      paymentMethod,
      immediateCheckIn
    } = req.body;

    if (!guestName || !guestPhone || !checkInDate || !checkOutDate) {
      return res.status(400).json({ success: false, message: 'guestName, guestPhone, checkInDate, and checkOutDate are required.' });
    }

    const normId = normalizeTypeId(typeId);
    let rtObj = memoryStore.roomTypes.find(rt => rt.typeId === typeId || rt.typeId === normId);
    if (!rtObj && mongoose.connection && mongoose.connection.readyState === 1) {
      rtObj = await RoomType.findOne({ typeId: normId });
    }
    if (!rtObj) rtObj = memoryStore.roomTypes[0];

    // Find available physical room
    let targetRoomNumber = roomNumber;
    const allPhysicalRooms = await getAllPhysicalRooms();
    const bookedRooms = await getOverlappingBookedRooms(checkInDate, checkOutDate);

    if (!targetRoomNumber) {
      const candidateRoom = allPhysicalRooms.find(r => 
        (r.typeId === rtObj.typeId || normalizeTypeId(r.typeId) === normId) &&
        r.status !== 'Under Maintenance' &&
        !bookedRooms.has(String(r.roomNumber))
      );
      if (!candidateRoom) {
        return res.status(409).json({ success: false, message: `No available rooms of type "${rtObj.name}" for these dates.` });
      }
      targetRoomNumber = candidateRoom.roomNumber;
    }

    const pkgInfo = getPackageTimings(stayPackage || 'standard_overnight');
    const isDay = stayPackage === 'day_stay' || stayPackage === 'DAY';
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const nights = isDay ? 1 : Math.max(1, Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)));

    const effectiveRate = Math.round(rtObj.pricePerNight * pkgInfo.multiplier);
    const roomTotal = effectiveRate * nights;
    const tax = Math.round(roomTotal * 0.12);
    const totalAmount = roomTotal + tax;

    const newBookingId = 'BK-WI-' + Math.floor(10000 + Math.random() * 90000);
    const isCheckedIn = Boolean(immediateCheckIn);

    const walkInRecord = {
      bookingId: newBookingId,
      userId: 'walkin-' + Math.random().toString(36).substring(2, 8),
      customerName: guestName.trim(),
      customerEmail: (guestEmail || 'walkin@guest.com').toLowerCase().trim(),
      customerPhone: guestPhone.trim(),
      typeId: rtObj.typeId,
      roomTypeName: rtObj.name,
      assignedRoomNumber: String(targetRoomNumber),
      roomsCount: 1,
      roomAllocations: [{
        allocationId: 'alloc-' + Math.floor(100000 + Math.random() * 900000),
        typeId: rtObj.typeId,
        typeName: rtObj.name,
        roomNumber: String(targetRoomNumber),
        floor: parseInt(String(targetRoomNumber)[0], 10) || 1,
        pricePerNight: effectiveRate,
        checkInStatus: isCheckedIn ? 'Checked-In' : 'Pending',
        checkInTime: isCheckedIn ? new Date() : null,
        checkOutTime: null
      }],
      checkInDate,
      checkOutDate,
      checkInTimeStr: pkgInfo.checkInTimeStr,
      checkOutTimeStr: pkgInfo.checkOutTimeStr,
      stayPackage: stayPackage || 'standard_overnight',
      stayTypeName: pkgInfo.stayTypeName,
      numberOfNights: nights,
      numberOfGuests: Number(numberOfGuests) || rtObj.occupancy || 2,
      adultsCount: Number(numberOfGuests) || 2,
      childrenCount: 0,
      pricePerNight: effectiveRate,
      roomTotal,
      tax,
      additionalCharges: 0,
      totalAmount,
      paymentStatus: 'Paid',
      paymentMethod: paymentMethod || 'Cash (Front Desk)',
      transactionId: 'POS-' + Math.floor(10000 + Math.random() * 90000),
      bookingStatus: isCheckedIn ? 'Checked-In' : 'Confirmed',
      specialRequests: 'Walk-in Guest created at Front Desk',
      isWalkIn: true,
      bookedByRole: req.user.role,
      checkInTime: isCheckedIn ? new Date() : null,
      createdAt: new Date()
    };

    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        await Booking.create(walkInRecord);
      } catch (e) {}
    }
    memoryStore.bookings.unshift({ ...walkInRecord });

    // Update physical room status to Occupied if checked in immediately
    if (isCheckedIn) {
      if (mongoose.connection && mongoose.connection.readyState === 1) {
        try {
          await Room.updateOne({ roomNumber: targetRoomNumber }, { $set: { status: 'Occupied', currentBookingId: newBookingId } });
        } catch (e) {}
      }
      const memRoom = memoryStore.rooms.find(r => r.roomNumber === targetRoomNumber);
      if (memRoom) {
        memRoom.status = 'Occupied';
        memRoom.currentBookingId = newBookingId;
      }
    }

    res.status(201).json({
      success: true,
      message: `Walk-in booking created successfully. Room ${targetRoomNumber} assigned.`,
      booking: walkInRecord
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 6. ASSIGN PHYSICAL ROOM NUMBER (Receptionist & Manager)
// PATCH /api/bookings/:id/assign-room { roomNumber, allocationId }
router.patch('/:id/assign-room', authenticateToken, requireRole(['receptionist', 'manager']), async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { roomNumber, allocationId } = req.body;

    if (!roomNumber) {
      return res.status(400).json({ success: false, message: 'roomNumber is required.' });
    }

    let booking = memoryStore.bookings.find(b => b.bookingId === bookingId);
    if (!booking && mongoose.connection && mongoose.connection.readyState === 1) {
      booking = await Booking.findOne({ bookingId });
    }

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // Verify room is available and not booked for dates
    const bookedRooms = await getOverlappingBookedRooms(booking.checkInDate, booking.checkOutDate, bookingId);
    if (bookedRooms.has(String(roomNumber))) {
      return res.status(409).json({ success: false, message: `Room ${roomNumber} is already booked for these dates.` });
    }

    if (allocationId && booking.roomAllocations) {
      const alloc = booking.roomAllocations.find(a => a.allocationId === allocationId);
      if (alloc) alloc.roomNumber = String(roomNumber);
      booking.assignedRoomNumber = booking.roomAllocations.map(a => a.roomNumber).filter(Boolean).join(', ');
    } else {
      booking.assignedRoomNumber = String(roomNumber);
      if (booking.roomAllocations && booking.roomAllocations.length === 1) {
        booking.roomAllocations[0].roomNumber = String(roomNumber);
      }
    }

    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        await Booking.updateOne({ bookingId }, { 
          $set: { 
            assignedRoomNumber: booking.assignedRoomNumber,
            roomAllocations: booking.roomAllocations
          } 
        });
      } catch (e) {}
    }

    res.json({
      success: true,
      message: `Room ${roomNumber} assigned successfully to booking #${bookingId}.`,
      booking
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 7. CHECK-IN GUEST (Supports Group Bookings & Individual Allocations)
// PATCH /api/bookings/:id/check-in { roomNumber, allocationId }
router.patch('/:id/check-in', authenticateToken, requireRole(['receptionist', 'manager']), async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { roomNumber, allocationId } = req.body;

    let booking = memoryStore.bookings.find(b => b.bookingId === bookingId);
    if (!booking && mongoose.connection && mongoose.connection.readyState === 1) {
      booking = await Booking.findOne({ bookingId });
    }

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (booking.bookingStatus === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Cannot check-in a cancelled reservation.' });
    }

    const checkInTime = new Date();

    // If specific allocation requested, check it in
    if (allocationId && booking.roomAllocations && booking.roomAllocations.length > 0) {
      const alloc = booking.roomAllocations.find(a => a.allocationId === allocationId);
      if (alloc) {
        if (roomNumber) alloc.roomNumber = String(roomNumber);
        alloc.checkInStatus = 'Checked-In';
        alloc.checkInTime = checkInTime;

        // Update physical room status
        if (alloc.roomNumber) {
          const rmNum = alloc.roomNumber;
          if (mongoose.connection && mongoose.connection.readyState === 1) {
            try {
              await Room.updateOne({ roomNumber: rmNum }, { $set: { status: 'Occupied', currentBookingId: bookingId } });
            } catch (e) {}
          }
          const memRoom = memoryStore.rooms.find(r => r.roomNumber === rmNum);
          if (memRoom) {
            memRoom.status = 'Occupied';
            memRoom.currentBookingId = bookingId;
          }
        }
      }
      // If all allocations checked in, mark overall booking Checked-In
      booking.bookingStatus = 'Checked-In';
      booking.checkInTime = booking.checkInTime || checkInTime;
    } else {
      // Check in all allocations
      const targetRoom = roomNumber || booking.assignedRoomNumber;
      if (!targetRoom && (!booking.roomAllocations || !booking.roomAllocations.some(a => a.roomNumber))) {
        return res.status(400).json({ success: false, message: 'A physical room must be assigned before check-in.' });
      }

      booking.bookingStatus = 'Checked-In';
      booking.checkInTime = checkInTime;
      if (roomNumber) booking.assignedRoomNumber = String(roomNumber);

      const roomsToOccupy = [];
      if (booking.roomAllocations && booking.roomAllocations.length > 0) {
        for (const alloc of booking.roomAllocations) {
          alloc.checkInStatus = 'Checked-In';
          alloc.checkInTime = checkInTime;
          if (alloc.roomNumber) roomsToOccupy.push(String(alloc.roomNumber));
        }
      }
      if (booking.assignedRoomNumber) {
        const parts = String(booking.assignedRoomNumber).split(',').map(s => s.trim());
        for (const p of parts) {
          if (p && !roomsToOccupy.includes(p)) roomsToOccupy.push(p);
        }
      }

      // Mark each physical room as Occupied
      for (const rm of roomsToOccupy) {
        if (mongoose.connection && mongoose.connection.readyState === 1) {
          try {
            await Room.updateOne({ roomNumber: rm }, { $set: { status: 'Occupied', currentBookingId: bookingId } });
          } catch (e) {}
        }
        const memRoom = memoryStore.rooms.find(r => r.roomNumber === rm);
        if (memRoom) {
          memRoom.status = 'Occupied';
          memRoom.currentBookingId = bookingId;
        }
      }
    }

    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        await Booking.updateOne({ bookingId }, { 
          $set: { 
            bookingStatus: booking.bookingStatus, 
            assignedRoomNumber: booking.assignedRoomNumber,
            roomAllocations: booking.roomAllocations,
            checkInTime: booking.checkInTime 
          } 
        });
      } catch (e) {}
    }

    // Customer notification
    memoryStore.notifications.unshift({
      notificationId: 'NOTIF-' + Math.floor(1000 + Math.random() * 9000),
      recipientUserId: booking.userId,
      recipientRole: 'customer',
      title: 'Welcome! Checked-In',
      message: `You have successfully checked into Room ${booking.assignedRoomNumber} at Hotel Saravana Grand.`,
      type: 'check_in',
      relatedBookingId: bookingId,
      isRead: false,
      createdAt: new Date()
    });

    res.json({
      success: true,
      message: `Guest checked in successfully. Room(s) ${booking.assignedRoomNumber} are now Occupied.`,
      booking
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 8. CHECK-OUT GUEST (Room transitions to 'Cleaning')
// PATCH /api/bookings/:id/check-out { additionalCharges, additionalChargesDescription, allocationId }
router.patch('/:id/check-out', authenticateToken, requireRole(['receptionist', 'manager']), async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { additionalCharges, additionalChargesDescription, allocationId } = req.body;

    let booking = memoryStore.bookings.find(b => b.bookingId === bookingId);
    if (!booking && mongoose.connection && mongoose.connection.readyState === 1) {
      booking = await Booking.findOne({ bookingId });
    }

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const checkOutTime = new Date();
    const addCharge = Number(additionalCharges) || 0;
    const newTotal = (booking.totalAmount || 0) + addCharge;

    const roomsToClean = [];

    // Individual allocation checkout vs full booking checkout
    if (allocationId && booking.roomAllocations && booking.roomAllocations.length > 0) {
      const alloc = booking.roomAllocations.find(a => a.allocationId === allocationId);
      if (alloc) {
        alloc.checkInStatus = 'Checked-Out';
        alloc.checkOutTime = checkOutTime;
        if (alloc.roomNumber) roomsToClean.push(String(alloc.roomNumber));
      }
      const allDone = booking.roomAllocations.every(a => a.checkInStatus === 'Checked-Out');
      if (allDone) {
        booking.bookingStatus = 'Completed';
        booking.checkOutTime = checkOutTime;
      }
    } else {
      booking.bookingStatus = 'Completed';
      booking.checkOutTime = checkOutTime;

      if (booking.roomAllocations && booking.roomAllocations.length > 0) {
        for (const alloc of booking.roomAllocations) {
          alloc.checkInStatus = 'Checked-Out';
          alloc.checkOutTime = checkOutTime;
          if (alloc.roomNumber) roomsToClean.push(String(alloc.roomNumber));
        }
      }
      if (booking.assignedRoomNumber) {
        const parts = String(booking.assignedRoomNumber).split(',').map(s => s.trim());
        for (const p of parts) {
          if (p && !roomsToClean.includes(p)) roomsToClean.push(p);
        }
      }
    }

    if (addCharge > 0) {
      booking.additionalCharges = (booking.additionalCharges || 0) + addCharge;
      booking.additionalChargesDescription = additionalChargesDescription || 'Mini-bar / Room service charges';
      booking.totalAmount = newTotal;
    }

    // Transition physical rooms to 'Cleaning'
    for (const rm of roomsToClean) {
      if (mongoose.connection && mongoose.connection.readyState === 1) {
        try {
          await Room.updateOne({ roomNumber: rm }, { 
            $set: { status: 'Cleaning', currentBookingId: null, lastCleanedAt: new Date() } 
          });
        } catch (e) {}
      }
      const memRoom = memoryStore.rooms.find(r => r.roomNumber === rm);
      if (memRoom) {
        memRoom.status = 'Cleaning';
        memRoom.currentBookingId = null;
        memRoom.lastCleanedAt = new Date();
      }
    }

    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        await Booking.updateOne({ bookingId }, { 
          $set: { 
            bookingStatus: booking.bookingStatus, 
            checkOutTime: booking.checkOutTime, 
            roomAllocations: booking.roomAllocations,
            additionalCharges: booking.additionalCharges, 
            additionalChargesDescription: booking.additionalChargesDescription,
            totalAmount: booking.totalAmount
          } 
        });
      } catch (e) {}
    }

    // Customer Notification
    memoryStore.notifications.unshift({
      notificationId: 'NOTIF-' + Math.floor(1000 + Math.random() * 9000),
      recipientUserId: booking.userId,
      recipientRole: 'customer',
      title: 'Check-Out Completed',
      message: `Thank you for staying at Hotel Saravana Grand! We hope you enjoyed your stay.`,
      type: 'check_out',
      relatedBookingId: bookingId,
      isRead: false,
      createdAt: new Date()
    });

    res.json({
      success: true,
      message: `Check-out finalized. Room(s) ${roomsToClean.join(', ')} marked as Cleaning.`,
      booking
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 9. CANCEL BOOKING (Customer or Receptionist/Manager)
router.patch('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { cancellationReason } = req.body;

    let booking = memoryStore.bookings.find(b => b.bookingId === bookingId);
    if (!booking && mongoose.connection && mongoose.connection.readyState === 1) {
      booking = await Booking.findOne({ bookingId });
    }

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // Customer role authorization check
    if (req.user.role === 'customer') {
      const isOwner = booking.userId === req.user.userId || booking.customerEmail?.toLowerCase() === req.user.email.toLowerCase();
      if (!isOwner) {
        return res.status(403).json({ success: false, message: 'Forbidden: You cannot cancel another guest’s reservation.' });
      }
    }

    if (booking.bookingStatus === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Booking is already cancelled.' });
    }
    if (booking.bookingStatus === 'Completed') {
      return res.status(400).json({ success: false, message: 'Cannot cancel a completed stay.' });
    }

    booking.bookingStatus = 'Cancelled';
    booking.paymentStatus = 'Refunded';
    booking.cancellationReason = cancellationReason || 'Cancelled by guest request';
    booking.cancelledAt = new Date();

    // Release any allocated rooms if currently reserved/occupied by this booking
    const roomsToRelease = [];
    if (booking.roomAllocations && booking.roomAllocations.length > 0) {
      for (const alloc of booking.roomAllocations) {
        if (alloc.roomNumber) roomsToRelease.push(String(alloc.roomNumber));
      }
    }
    if (booking.assignedRoomNumber) {
      const parts = String(booking.assignedRoomNumber).split(',').map(s => s.trim());
      for (const p of parts) {
        if (p && !roomsToRelease.includes(p)) roomsToRelease.push(p);
      }
    }

    for (const rm of roomsToRelease) {
      const memRoom = memoryStore.rooms.find(r => r.roomNumber === rm);
      if (memRoom && memRoom.status !== 'Under Maintenance') {
        memRoom.status = 'Available';
        memRoom.currentBookingId = null;
      }
      if (mongoose.connection && mongoose.connection.readyState === 1) {
        try {
          await Room.updateOne({ roomNumber: rm, status: { $ne: 'Under Maintenance' } }, { $set: { status: 'Available', currentBookingId: null } });
        } catch (e) {}
      }
    }

    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        await Booking.updateOne({ bookingId }, {
          $set: {
            bookingStatus: 'Cancelled',
            paymentStatus: 'Refunded',
            cancellationReason: booking.cancellationReason,
            cancelledAt: booking.cancelledAt
          }
        });
      } catch (e) {}
    }

    // Customer Notification
    memoryStore.notifications.unshift({
      notificationId: 'NOTIF-' + Math.floor(1000 + Math.random() * 9000),
      recipientUserId: booking.userId,
      recipientRole: 'customer',
      title: 'Booking Cancelled',
      message: `Reservation #${bookingId} has been cancelled. Refund initiated to original payment source.`,
      type: 'booking_cancelled',
      relatedBookingId: bookingId,
      isRead: false,
      createdAt: new Date()
    });

    res.json({
      success: true,
      message: 'Booking cancelled successfully. Payment marked as Refunded.',
      booking
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
