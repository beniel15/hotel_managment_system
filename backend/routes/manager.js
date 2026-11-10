import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Room from '../models/Room.js';
import RoomType from '../models/RoomType.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import Maintenance from '../models/Maintenance.js';
import { memoryStore } from '../services/dataRepository.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Strict security: All routes require Manager or Owner role
router.use(authenticateToken);
router.use(requireRole(['manager', 'owner']));

// 1. BUSINESS ANALYTICS & KPIS
router.get('/analytics', async (req, res) => {
  try {
    let rooms = [];
    let bookings = [];
    let payments = [];
    let roomTypes = [];

    try {
      rooms = await Room.find().lean();
      bookings = await Booking.find().lean();
      payments = await Payment.find().lean();
      roomTypes = await RoomType.find().lean();
    } catch (e) {
      rooms = memoryStore.rooms;
      bookings = memoryStore.bookings;
      payments = memoryStore.payments;
      roomTypes = memoryStore.roomTypes;
    }

    if (!rooms.length) rooms = memoryStore.rooms;
    if (!bookings.length) bookings = memoryStore.bookings;
    if (!payments.length) payments = memoryStore.payments;
    if (!roomTypes.length) roomTypes = memoryStore.roomTypes;

    const totalRooms = rooms.length;
    const occupiedRooms = rooms.filter(r => r.status === 'Occupied').length;
    const availableRooms = rooms.filter(r => r.status === 'Available').length;
    const maintenanceRooms = rooms.filter(r => r.status === 'Under Maintenance').length;
    const cleaningRooms = rooms.filter(r => r.status === 'Cleaning').length;

    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    // Today's dates in YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    const todayArrivals = bookings.filter(b => b.checkInDate === today && b.bookingStatus !== 'Cancelled').length;
    const todayDepartures = bookings.filter(b => b.checkOutDate === today && b.bookingStatus === 'Checked-In').length;

    // Revenue calculations
    const validBookings = bookings.filter(b => b.bookingStatus !== 'Cancelled');
    const totalRevenue = validBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const pendingPayments = bookings.filter(b => b.paymentStatus === 'Pending').reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const refundedPayments = bookings.filter(b => b.paymentStatus === 'Refunded').reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    // Daily Revenue Analytics (last 7 days)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      
      const dayRevenue = bookings
        .filter(b => b.checkInDate === dateStr && b.bookingStatus !== 'Cancelled')
        .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

      const dayBookings = bookings.filter(b => b.checkInDate === dateStr).length;

      last7Days.push({
        date: dateStr,
        label: dayLabel,
        revenue: dayRevenue,
        bookings: dayBookings
      });
    }

    // Monthly Revenue Analytics (last 6 months)
    const monthlyRevenue = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = m.getFullYear();
      const monthIdx = m.getMonth();
      const label = `${monthNames[monthIdx]} ${year}`;

      const mRevenue = bookings
        .filter(b => {
          if (!b.createdAt && !b.checkInDate) return false;
          const bDate = new Date(b.createdAt || b.checkInDate);
          return bDate.getFullYear() === year && bDate.getMonth() === monthIdx && b.bookingStatus !== 'Cancelled';
        })
        .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

      monthlyRevenue.push({
        month: label,
        revenue: mRevenue
      });
    }

    // Booking Status Distribution
    const bookingStatusStats = [
      { name: 'Confirmed', count: bookings.filter(b => b.bookingStatus === 'Confirmed').length, color: '#6c5ce7' },
      { name: 'Checked-In', count: bookings.filter(b => b.bookingStatus === 'Checked-In').length, color: '#f59e0b' },
      { name: 'Completed', count: bookings.filter(b => b.bookingStatus === 'Completed').length, color: '#10b981' },
      { name: 'Cancelled', count: bookings.filter(b => b.bookingStatus === 'Cancelled').length, color: '#ef4444' }
    ];

    // Most frequently booked room types
    const roomTypeStats = roomTypes.map(rt => {
      const typeBookings = bookings.filter(b => b.typeId === rt.typeId && b.bookingStatus !== 'Cancelled');
      const count = typeBookings.length;
      const revenue = typeBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
      return {
        name: rt.name,
        typeId: rt.typeId,
        bookingsCount: count,
        totalRevenue: revenue
      };
    }).sort((a, b) => b.bookingsCount - a.bookingsCount);

    res.json({
      success: true,
      metrics: {
        totalRooms,
        occupiedRooms,
        availableRooms,
        maintenanceRooms,
        cleaningRooms,
        occupancyRate,
        totalBookings: bookings.length,
        todayArrivals,
        todayDepartures,
        totalRevenue,
        pendingPayments,
        refundedPayments
      },
      charts: {
        dailyRevenue: last7Days,
        monthlyRevenue,
        bookingStatusDistribution: bookingStatusStats,
        popularRoomTypes: roomTypeStats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. STAFF MANAGEMENT: GET ALL RECEPTIONISTS
router.get('/staff', async (req, res) => {
  try {
    let staff = [];
    try {
      staff = await User.find({ role: 'receptionist' }).select('-password').lean();
    } catch (e) {
      staff = memoryStore.users.filter(u => u.role === 'receptionist');
    }
    if (!staff.length) {
      staff = memoryStore.users.filter(u => u.role === 'receptionist');
    }

    res.json({ success: true, staff });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. STAFF MANAGEMENT: CREATE RECEPTIONIST ACCOUNT
router.post('/staff', async (req, res) => {
  try {
    const { name, email, password, phone, shift } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    let existing = memoryStore.users.find(u => u.email === normalizedEmail);
    if (!existing) {
      try {
        existing = await User.findOne({ email: normalizedEmail });
      } catch (e) {}
    }

    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUserId = 'usr-rec-' + Math.floor(100 + Math.random() * 900);

    const staffData = {
      userId: newUserId,
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: 'receptionist',
      phone: phone || '+91 98765 00000',
      assignedShift: shift || 'General',
      isActive: true,
      photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${normalizedEmail}`
    };

    try {
      await User.create(staffData);
    } catch (e) {
      console.warn('DB User staff create notice:', e.message);
    }
    memoryStore.users.push({ ...staffData });

    res.status(201).json({
      success: true,
      message: `Receptionist account created for ${staffData.name}.`,
      staff: {
        userId: staffData.userId,
        name: staffData.name,
        email: staffData.email,
        role: staffData.role,
        phone: staffData.phone,
        assignedShift: staffData.assignedShift,
        isActive: staffData.isActive
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. STAFF MANAGEMENT: ACTIVATE OR DEACTIVATE ACCOUNT
router.patch('/staff/:userId/status', async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive boolean flag is required.' });
    }

    let user = memoryStore.users.find(u => u.userId === userId && u.role === 'receptionist');
    if (!user) {
      user = await User.findOne({ userId, role: 'receptionist' });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'Receptionist account not found.' });
    }

    user.isActive = isActive;
    try {
      await User.updateOne({ userId }, { $set: { isActive } });
    } catch (e) {}

    res.json({
      success: true,
      message: `Staff account ${isActive ? 'activated' : 'deactivated'} successfully.`,
      staff: user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. MAINTENANCE: GET ALL RECORDS
router.get('/maintenance', async (req, res) => {
  try {
    let logs = [];
    try {
      logs = await Maintenance.find().sort({ createdAt: -1 }).lean();
    } catch (e) {
      logs = memoryStore.maintenance;
    }
    if (!logs.length) logs = memoryStore.maintenance;

    res.json({ success: true, maintenance: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 6. MAINTENANCE: SCHEDULE / MARK ROOM UNDER MAINTENANCE
router.post('/maintenance', async (req, res) => {
  try {
    const { roomNumber, issueDescription, severity } = req.body;

    if (!roomNumber || !issueDescription) {
      return res.status(400).json({ success: false, message: 'roomNumber and issueDescription are required.' });
    }

    const cleanRoomNum = String(roomNumber).trim();

    // Verify room exists in memory or DB
    let room = memoryStore.rooms.find(r => String(r.roomNumber).trim() === cleanRoomNum);
    if (!room && mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        room = await Room.findOne({ roomNumber: cleanRoomNum });
      } catch (e) {}
    }

    if (!room) {
      return res.status(404).json({ success: false, message: `Room ${cleanRoomNum} not found in inventory.` });
    }

    // Normalize severity to valid enum: 'Low', 'Medium', 'High', 'Critical'
    let cleanSeverity = 'Medium';
    const s = String(severity || '').toLowerCase();
    if (s.includes('low')) cleanSeverity = 'Low';
    else if (s.includes('crit')) cleanSeverity = 'Critical';
    else if (s.includes('high')) cleanSeverity = 'High';
    else cleanSeverity = 'Medium';

    const newMntId = 'MNT-' + Math.floor(1000 + Math.random() * 9000);
    const mntRecord = {
      maintenanceId: newMntId,
      roomNumber: cleanRoomNum,
      issueDescription: issueDescription.trim(),
      severity: cleanSeverity,
      status: 'In Progress',
      reportedBy: req.user?.name || 'General Manager',
      reportedByRole: req.user?.role || 'manager',
      startDate: new Date(),
      resolvedDate: null
    };

    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        await Maintenance.create(mntRecord);
      } catch (e) {
        console.warn('DB Maintenance create notice:', e.message);
      }
    }
    memoryStore.maintenance.unshift({ ...mntRecord });

    // Mark physical room as 'Under Maintenance'
    room.status = 'Under Maintenance';
    room.maintenanceNotes = issueDescription.trim();

    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        await Room.updateOne(
          { roomNumber: cleanRoomNum }, 
          { $set: { status: 'Under Maintenance', maintenanceNotes: issueDescription.trim() } }
        );
      } catch (e) {}
    }

    res.status(201).json({
      success: true,
      message: `Room ${cleanRoomNum} placed Under Maintenance. It will be excluded from customer booking availability.`,
      maintenance: mntRecord
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 7. MAINTENANCE: COMPLETE AND RESTORE ROOM TO SERVICE
router.patch('/maintenance/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const { resolutionNotes } = req.body;

    let mnt = memoryStore.maintenance.find(m => m.maintenanceId === id || m._id?.toString() === id);
    if (!mnt) mnt = await Maintenance.findOne({ maintenanceId: id });
    if (!mnt) return res.status(404).json({ success: false, message: 'Maintenance record not found.' });

    mnt.status = 'Completed';
    mnt.resolvedDate = new Date();
    mnt.resolutionNotes = resolutionNotes || 'Repairs completed and inspected by management.';

    try {
      await Maintenance.updateOne(
        { maintenanceId: mnt.maintenanceId },
        { $set: { status: 'Completed', resolvedDate: mnt.resolvedDate, resolutionNotes: mnt.resolutionNotes } }
      );
    } catch (e) {}

    // Restore room to 'Cleaning' so housekeeping prepares it before guest arrival
    const roomNumber = mnt.roomNumber;
    let room = memoryStore.rooms.find(r => r.roomNumber === roomNumber);
    if (room) {
      room.status = 'Cleaning';
      room.maintenanceNotes = '';
    }
    try {
      await Room.updateOne({ roomNumber }, { $set: { status: 'Cleaning', maintenanceNotes: '' } });
    } catch (e) {}

    res.json({
      success: true,
      message: `Maintenance completed for Room ${roomNumber}. Room transferred to Housekeeping Cleaning status.`,
      maintenance: mnt
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

