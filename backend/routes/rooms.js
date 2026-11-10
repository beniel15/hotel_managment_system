import express from 'express';
import mongoose from 'mongoose';
import RoomType from '../models/RoomType.js';
import Room from '../models/Room.js';
import Booking from '../models/Booking.js';
import Maintenance from '../models/Maintenance.js';
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

// 1. GET ALL ROOM TYPES (Public)
router.get('/types', async (req, res) => {
  try {
    let types = [];
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        types = await RoomType.find({ isActive: true }).lean();
      } catch (e) {
        types = memoryStore.roomTypes.filter(rt => rt.isActive !== false);
      }
    } else {
      types = memoryStore.roomTypes.filter(rt => rt.isActive !== false);
    }
    if (!types || !types.length) {
      types = memoryStore.roomTypes.filter(rt => rt.isActive !== false);
    }

    res.json({ success: true, roomTypes: types });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. REAL-TIME ROOM AVAILABILITY SEARCH (Public & Customer)
// GET /api/rooms/availability?checkInDate=2026-11-03&checkOutDate=2026-11-05&guests=2&stayPackage=standard_overnight&roomsCount=1&preferredFloor=1
router.get('/availability', async (req, res) => {
  try {
    const { checkInDate, checkOutDate, guests, stayPackage, roomsCount, preferredFloor } = req.query;

    if (!checkInDate || !checkOutDate) {
      return res.status(400).json({
        success: false,
        message: 'Both checkInDate and checkOutDate (YYYY-MM-DD) are required.'
      });
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid date format. Expected YYYY-MM-DD.' });
    }

    // For day stay, check-out can be the same day or day after
    const isDayStay = stayPackage === 'day_stay' || stayPackage === 'DAY';
    if (!isDayStay && checkOut <= checkIn) {
      return res.status(400).json({ success: false, message: 'Check-out date must be strictly after check-in date.' });
    }

    const requestedGuests = parseInt(guests, 10) || 1;
    const requestedRooms = parseInt(roomsCount, 10) || 1;

    // Fetch all active physical rooms
    let allPhysicalRooms = [];
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        allPhysicalRooms = await Room.find({ isActive: true }).lean();
      } catch (e) {
        allPhysicalRooms = memoryStore.rooms.filter(r => r.isActive !== false);
      }
    } else {
      allPhysicalRooms = memoryStore.rooms.filter(r => r.isActive !== false);
    }
    if (!allPhysicalRooms || !allPhysicalRooms.length) {
      allPhysicalRooms = memoryStore.rooms.filter(r => r.isActive !== false);
    }

    // Date Overlap Rule: existingCheckIn < requestedCheckOut && existingCheckOut > requestedCheckIn
    // Filter active bookings (exclude Cancelled, Rejected, Completed)
    let overlappingBookings = [];
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        overlappingBookings = await Booking.find({
          bookingStatus: { $in: ['Confirmed', 'Checked-In'] },
          checkInDate: { $lt: checkOutDate },
          checkOutDate: { $gt: checkInDate }
        }).lean();
      } catch (e) {
        overlappingBookings = memoryStore.bookings.filter(b => 
          (b.bookingStatus === 'Confirmed' || b.bookingStatus === 'Checked-In') &&
          (b.checkInDate < checkOutDate && b.checkOutDate > checkInDate)
        );
      }
    } else {
      overlappingBookings = memoryStore.bookings.filter(b => 
        (b.bookingStatus === 'Confirmed' || b.bookingStatus === 'Checked-In') &&
        (b.checkInDate < checkOutDate && b.checkOutDate > checkInDate)
      );
    }

    // Collect all booked physical room numbers from overlapping bookings
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

    // Rooms under maintenance are also unavailable
    const maintenanceRoomNumbers = new Set(
      allPhysicalRooms
        .filter(r => r.status === 'Under Maintenance')
        .map(r => String(r.roomNumber))
    );

    // Fetch room types
    let roomTypes = [];
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        roomTypes = await RoomType.find({ isActive: true }).lean();
      } catch (e) {
        roomTypes = memoryStore.roomTypes.filter(rt => rt.isActive !== false);
      }
    } else {
      roomTypes = memoryStore.roomTypes.filter(rt => rt.isActive !== false);
    }
    if (!roomTypes || !roomTypes.length) {
      roomTypes = memoryStore.roomTypes.filter(rt => rt.isActive !== false);
    }

    // Calculate available count per room type
    const availabilityResults = roomTypes.map(rt => {
      // Find all physical rooms belonging to this type
      const totalRoomsForType = allPhysicalRooms.filter(r => 
        r.typeId === rt.typeId || normalizeTypeId(r.typeId) === normalizeTypeId(rt.typeId)
      );
      
      // Filter out rooms that are booked or in maintenance
      const availablePhysicalRooms = totalRoomsForType.filter(r => 
        !bookedRoomNumbers.has(String(r.roomNumber)) && 
        !maintenanceRoomNumbers.has(String(r.roomNumber))
      );

      // If customer requested a preferred floor, prioritize rooms on that floor first
      if (preferredFloor && preferredFloor !== 'any') {
        const pFloor = Number(preferredFloor);
        availablePhysicalRooms.sort((a, b) => {
          if (a.floor === pFloor && b.floor !== pFloor) return -1;
          if (b.floor === pFloor && a.floor !== pFloor) return 1;
          return 0;
        });
      }

      const availableCount = availablePhysicalRooms.length;
      const normId = normalizeTypeId(rt.typeId);
      const roomCapacity = normId === 'rt-premium' ? 9 : (normId === 'rt-deluxe' ? 5 : 3);
      const isCapacitySuitable = (roomCapacity * requestedRooms) >= requestedGuests;
      const isAvailable = availableCount >= requestedRooms;

      // Adjust price according to selected stay package:
      // Standard Room: Overnight ₹999 / night, Day Stay ₹1,399 / day
      // Deluxe Room: Overnight ₹1,199 / night, Day Stay ₹1,500 / day
      // Premium Room: Overnight ₹2,000 / night, Day Stay ₹3,499 / day (2 rooms attached + balcony)
      let effectiveRate = 999;
      if (isDayStay || stayPackage === 'day_stay' || stayPackage === 'DAY' || stayPackage === 'full_24h' || stayPackage === 'FULL_DAY') {
        effectiveRate = normId === 'rt-premium' ? 3499 : (normId === 'rt-deluxe' ? 1500 : 1399);
      } else {
        effectiveRate = normId === 'rt-premium' ? 2000 : (normId === 'rt-deluxe' ? 1199 : 999);
      }

      return {
        ...rt,
        occupancy: roomCapacity,
        pricePerNight: effectiveRate,
        basePrice: effectiveRate,
        totalRoomsCount: totalRoomsForType.length,
        availableRoomsCount: availableCount,
        availableRoomNumbers: availablePhysicalRooms.map(r => r.roomNumber),
        availablePhysicalRooms: availablePhysicalRooms.map(r => ({ roomNumber: r.roomNumber, floor: r.floor })),
        isAvailable,
        isCapacitySuitable
      };
    });

    // Calculate live availability breakdown across all floors (Floor 1, 2, 3)
    const floorBreakdown = {
      1: { floor: 1, name: '1st Floor (Standard Executive)', total: 0, available: 0, availableRoomNumbers: [] },
      2: { floor: 2, name: '2nd Floor (Deluxe Lounge)', total: 0, available: 0, availableRoomNumbers: [] },
      3: { floor: 3, name: '3rd Floor (Premium Suites + Balcony)', total: 0, available: 0, availableRoomNumbers: [] }
    };

    allPhysicalRooms.forEach(r => {
      const f = Number(r.floor) || 1;
      if (!floorBreakdown[f]) {
        floorBreakdown[f] = { floor: f, name: `Floor ${f}`, total: 0, available: 0, availableRoomNumbers: [] };
      }
      floorBreakdown[f].total += 1;
      const isFree = !bookedRoomNumbers.has(String(r.roomNumber)) && !maintenanceRoomNumbers.has(String(r.roomNumber));
      if (isFree) {
        floorBreakdown[f].available += 1;
        floorBreakdown[f].availableRoomNumbers.push(String(r.roomNumber));
      }
    });

    // Check Preferred Floor Status
    const reqFloor = preferredFloor && preferredFloor !== 'any' ? Number(preferredFloor) : null;
    let floorStatus = null;
    if (reqFloor) {
      const targetFloorInfo = floorBreakdown[reqFloor] || { available: 0, total: 0 };
      const hasVacancy = targetFloorInfo.available >= requestedRooms;
      const alternateFloors = Object.values(floorBreakdown)
        .filter(fb => fb.floor !== reqFloor && fb.available >= requestedRooms);

      floorStatus = {
        preferredFloor: reqFloor,
        hasVacancy,
        availableCount: targetFloorInfo.available,
        totalRooms: targetFloorInfo.total,
        message: hasVacancy
          ? `Floor ${reqFloor} has vacancy (${targetFloorInfo.available} room(s) available)! A room on Floor ${reqFloor} will be assigned.`
          : `Floor ${reqFloor} is fully booked for the selected dates! Vacancies available on Floor 2 (${floorBreakdown[2]?.available || 0} rooms) & Floor 3 (${floorBreakdown[3]?.available || 0} rooms). Would you like to select Floor 2 or Floor 3 instead?`,
        alternateFloors: alternateFloors.map(f => ({ floor: f.floor, name: f.name, available: f.available }))
      };
    }

    const diffDays = Math.max(1, Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)));

    res.json({
      success: true,
      searchCriteria: {
        checkInDate,
        checkOutDate,
        numberOfNights: isDayStay ? 1 : diffDays,
        guests: requestedGuests,
        roomsCount: requestedRooms,
        stayPackage: stayPackage || 'standard_overnight',
        preferredFloor: reqFloor || 'any'
      },
      floorBreakdown,
      floorStatus,
      roomTypes: availabilityResults
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. GET PHYSICAL ROOMS INVENTORY & OPERATIONAL STATUS (Receptionist & Manager)
router.get('/physical', authenticateToken, requireRole(['receptionist', 'manager']), async (req, res) => {
  try {
    let physicalRooms = [];
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        physicalRooms = await Room.find().sort({ roomNumber: 1 }).lean();
      } catch (e) {
        physicalRooms = memoryStore.rooms;
      }
    } else {
      physicalRooms = memoryStore.rooms;
    }
    if (!physicalRooms.length) {
      physicalRooms = memoryStore.rooms;
    }

    res.json({ success: true, rooms: physicalRooms });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. UPDATE PHYSICAL ROOM OPERATIONAL STATUS (Receptionist & Manager)
// Statuses: 'Available', 'Reserved', 'Occupied', 'Cleaning', 'Under Maintenance'
router.patch('/physical/:roomNumber/status', authenticateToken, requireRole(['receptionist', 'manager']), async (req, res) => {
  try {
    const { roomNumber } = req.params;
    const { status, maintenanceNotes } = req.body;

    const validStatuses = ['Available', 'Reserved', 'Occupied', 'Cleaning', 'Under Maintenance'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    let updatedRoom = null;
    const updateObj = { status };
    if (maintenanceNotes !== undefined) updateObj.maintenanceNotes = maintenanceNotes;
    if (status === 'Cleaning') updateObj.lastCleanedAt = new Date();

    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        updatedRoom = await Room.findOneAndUpdate(
          { roomNumber },
          { $set: updateObj },
          { new: true }
        );
      } catch (e) {
        console.warn('DB update room status notice:', e.message);
      }
    }

    const memRoom = memoryStore.rooms.find(r => r.roomNumber === roomNumber);
    if (memRoom) {
      memRoom.status = status;
      if (maintenanceNotes !== undefined) memRoom.maintenanceNotes = maintenanceNotes;
      if (status === 'Cleaning') memRoom.lastCleanedAt = new Date();
      if (!updatedRoom) updatedRoom = memRoom;
    }

    if (!updatedRoom) {
      return res.status(404).json({ success: false, message: `Room ${roomNumber} not found.` });
    }

    res.json({
      success: true,
      message: `Room ${roomNumber} status updated to ${status}.`,
      room: updatedRoom
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. MARK ROOM CLEANED / AVAILABLE (Quick Housekeeping Action)
router.patch('/physical/:roomNumber/clean', authenticateToken, requireRole(['receptionist', 'manager']), async (req, res) => {
  try {
    const { roomNumber } = req.params;
    const updateObj = { status: 'Available', lastCleanedAt: new Date(), maintenanceNotes: '' };

    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        await Room.updateOne({ roomNumber }, { $set: updateObj });
      } catch (e) {}
    }

    const memRoom = memoryStore.rooms.find(r => r.roomNumber === roomNumber);
    if (memRoom) {
      memRoom.status = 'Available';
      memRoom.lastCleanedAt = new Date();
      memRoom.maintenanceNotes = '';
    }

    res.json({
      success: true,
      message: `Room ${roomNumber} is now Clean and Available for check-in.`,
      room: memRoom
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 6. CREATE NEW PHYSICAL ROOM (Manager only)
router.post('/physical', authenticateToken, requireRole(['manager']), async (req, res) => {
  try {
    const { roomNumber, floor, typeId, capacity } = req.body;

    if (!roomNumber || !floor || !typeId) {
      return res.status(400).json({ success: false, message: 'roomNumber, floor, and typeId are required.' });
    }

    let typeObj = memoryStore.roomTypes.find(rt => rt.typeId === typeId);
    if (!typeObj && mongoose.connection && mongoose.connection.readyState === 1) {
      typeObj = await RoomType.findOne({ typeId });
    }
    const typeName = typeObj ? typeObj.name : 'Standard Room';

    const newRoom = {
      roomId: 'room-' + roomNumber,
      roomNumber: String(roomNumber).trim(),
      floor: Number(floor),
      typeId,
      typeName,
      capacity: Number(capacity) || (typeObj ? typeObj.occupancy : 2),
      status: 'Available',
      isActive: true
    };

    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        await Room.create(newRoom);
      } catch (e) {}
    }
    memoryStore.rooms.push(newRoom);

    res.status(201).json({ success: true, message: `Room ${roomNumber} added to inventory.`, room: newRoom });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
