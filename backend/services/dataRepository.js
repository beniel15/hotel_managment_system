import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/User.js';
import HotelConfig from '../models/HotelConfig.js';
import RoomType from '../models/RoomType.js';
import Room from '../models/Room.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import Review from '../models/Review.js';
import Maintenance from '../models/Maintenance.js';
import Notification from '../models/Notification.js';

// 1. INITIAL HOTEL PROFILE
export const INITIAL_HOTEL_DATA = {
  hotelId: 'single-hotel-saravana',
  name: 'Hotel Saravana Grand',
  tagline: 'Luxury Living & South Indian Vegetarian Hospitality',
  city: 'Madurai',
  state: 'Tamil Nadu',
  country: 'India',
  locationAddress: 'Mattuthavani Bus Stand Road, Near Periyar Bus Stand, Madurai, Tamil Nadu 625020',
  phone: '+91 452 234 5678',
  email: 'reservations@hotelsaravanagrand.com',
  website: 'https://hotelsaravanagrand.com',
  rating: 4.8,
  reviewsCount: 620,
  description: 'Premier luxury hotel stay in Madurai offering exquisitely furnished air-conditioned chambers, traditional South Indian vegetarian hospitality, cozy suites, 24/7 dedicated room service, ergonomic workstations, and complimentary valet parking.',
  amenities: [
    'Free High-Speed Wi-Fi',
    'Central Air Conditioning',
    'Pure Veg Fine Dining Restaurant',
    '24/7 Front Desk & Concierge',
    'Free Valet Parking',
    'Ergonomic Work Desk',
    'Conference & Banquet Hall',
    'Daily Housekeeping'
  ],
  images: [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80'
  ],
  checkInTime: '12:00 PM',
  checkOutTime: '11:00 AM',
  cancellationPolicy: 'Free cancellation up to 24 hours prior to check-in. Cancellations made within 24 hours incur a 1-night retention fee.',
  taxRatePercent: 12
};

// 2. INITIAL ROOM TYPES (10 Standard, 6 Deluxe, 4 Premium)
export const INITIAL_ROOM_TYPES = [
  {
    typeId: 'rt-standard',
    name: 'Standard Room',
    description: 'Comfortable executive air-conditioned room with queen bed, ergonomic work desk, high-speed Wi-Fi, and ensuite shower. Max capacity 3 guests per room.',
    occupancy: 3, // Max 3 guests
    bedType: '1 Queen Bed',
    pricePerNight: 999,      // ₹999 per night
    dayStayPrice: 1399,      // ₹1,399 per day
    totalInventory: 10,
    amenities: ['1 Queen Bed', 'Central AC', 'High-Speed Wi-Fi', 'Work Desk & Lamp', 'Tea/Coffee Maker', 'Ensuite Shower'],
    images: [
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80'
    ],
    isActive: true
  },
  {
    typeId: 'rt-deluxe',
    name: 'Deluxe Room',
    description: 'Spacious air-conditioned room with king-size bed, sitting lounge, 43" Smart TV, wardrobe, and ensuite geyser bathroom. Max capacity 5 guests per room.',
    occupancy: 5, // Max 5 guests
    bedType: '1 King Bed + Sofa Bed',
    pricePerNight: 1199,     // ₹1,199 per night
    dayStayPrice: 1500,      // ₹1,500 per day
    totalInventory: 6,
    amenities: ['King Bed + Sofa Bed', 'Central AC', 'Smart TV 43"', 'Wardrobe & Safe', 'Writing Table & Armchair', 'Ensuite Bathroom with Geyser'],
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80'
    ],
    isActive: true
  },
  {
    typeId: 'rt-premium',
    name: 'Premium Room',
    description: '2 rooms attached inside with private scenic balcony, 2 smart TVs, mini-fridge, double vanity, and spacious living parlor. Max capacity 9 guests per room.',
    occupancy: 9, // Max 9 guests
    bedType: '2 Rooms Attached + Balcony',
    pricePerNight: 2000,     // ₹2,000 per night
    dayStayPrice: 3499,      // ₹3,499 per day
    totalInventory: 4,
    amenities: ['2 Attached Chambers', 'Private Scenic Balcony', '2 Smart TVs', 'Mini-Fridge', 'Complimentary Breakfast', 'Bathtub & Rain Shower'],
    images: [
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80'
    ],
    isActive: true
  }
];

// 3. INITIAL PHYSICAL ROOMS (10 Standard, 6 Deluxe, 4 Premium = 20 Rooms total)
export const INITIAL_PHYSICAL_ROOMS = [
  // Floor 1: 10 Standard Rooms (Capacity 3)
  { roomId: 'room-101', roomNumber: '101', floor: 1, typeId: 'rt-standard', typeName: 'Standard Room', capacity: 3, status: 'Available' },
  { roomId: 'room-102', roomNumber: '102', floor: 1, typeId: 'rt-standard', typeName: 'Standard Room', capacity: 3, status: 'Available' },
  { roomId: 'room-103', roomNumber: '103', floor: 1, typeId: 'rt-standard', typeName: 'Standard Room', capacity: 3, status: 'Cleaning', maintenanceNotes: 'Scheduled checkout cleaning' },
  { roomId: 'room-104', roomNumber: '104', floor: 1, typeId: 'rt-standard', typeName: 'Standard Room', capacity: 3, status: 'Available' },
  { roomId: 'room-105', roomNumber: '105', floor: 1, typeId: 'rt-standard', typeName: 'Standard Room', capacity: 3, status: 'Available' },
  { roomId: 'room-106', roomNumber: '106', floor: 1, typeId: 'rt-standard', typeName: 'Standard Room', capacity: 3, status: 'Available' },
  { roomId: 'room-107', roomNumber: '107', floor: 1, typeId: 'rt-standard', typeName: 'Standard Room', capacity: 3, status: 'Available' },
  { roomId: 'room-108', roomNumber: '108', floor: 1, typeId: 'rt-standard', typeName: 'Standard Room', capacity: 3, status: 'Under Maintenance', maintenanceNotes: 'AC cooling unit servicing' },
  { roomId: 'room-109', roomNumber: '109', floor: 1, typeId: 'rt-standard', typeName: 'Standard Room', capacity: 3, status: 'Available' },
  { roomId: 'room-110', roomNumber: '110', floor: 1, typeId: 'rt-standard', typeName: 'Standard Room', capacity: 3, status: 'Available' },

  // Floor 2: 6 Deluxe Rooms (Capacity 5)
  { roomId: 'room-201', roomNumber: '201', floor: 2, typeId: 'rt-deluxe', typeName: 'Deluxe Room', capacity: 5, status: 'Available' },
  { roomId: 'room-202', roomNumber: '202', floor: 2, typeId: 'rt-deluxe', typeName: 'Deluxe Room', capacity: 5, status: 'Cleaning', maintenanceNotes: 'Housekeeping in progress' },
  { roomId: 'room-203', roomNumber: '203', floor: 2, typeId: 'rt-deluxe', typeName: 'Deluxe Room', capacity: 5, status: 'Available' },
  { roomId: 'room-204', roomNumber: '204', floor: 2, typeId: 'rt-deluxe', typeName: 'Deluxe Room', capacity: 5, status: 'Available' },
  { roomId: 'room-205', roomNumber: '205', floor: 2, typeId: 'rt-deluxe', typeName: 'Deluxe Room', capacity: 5, status: 'Available' },
  { roomId: 'room-206', roomNumber: '206', floor: 2, typeId: 'rt-deluxe', typeName: 'Deluxe Room', capacity: 5, status: 'Available' },

  // Floor 3: 4 Premium Rooms (Capacity 9, 2 Rooms Attached + Balcony)
  { roomId: 'room-301', roomNumber: '301', floor: 3, typeId: 'rt-premium', typeName: 'Premium Room', capacity: 9, status: 'Available' },
  { roomId: 'room-302', roomNumber: '302', floor: 3, typeId: 'rt-premium', typeName: 'Premium Room', capacity: 9, status: 'Available' },
  { roomId: 'room-303', roomNumber: '303', floor: 3, typeId: 'rt-premium', typeName: 'Premium Room', capacity: 9, status: 'Available' },
  { roomId: 'room-304', roomNumber: '304', floor: 3, typeId: 'rt-premium', typeName: 'Premium Room', capacity: 9, status: 'Available' }
];

// Instant, zero-delay in-memory store initialized with hotel & rooms immediately
export const memoryStore = {
  hotel: { ...INITIAL_HOTEL_DATA },
  users: [
    {
      userId: 'usr-mgr-1',
      uid: 'usr-mgr-1',
      name: 'General Manager',
      email: 'manager@hotelsaravana.com',
      password: '$2a$10$wOqZqK72m8Y1.w941x2U2.a7tC0F.LzS6fE82c4QxH9z5vK0A6g1G', // Manager@123
      role: 'manager',
      phone: '+91 94433 11223',
      isActive: true
    },
    {
      userId: 'usr-rec-1',
      uid: 'usr-rec-1',
      name: 'Desk Receptionist',
      email: 'receptionist@hotelsaravana.com',
      password: '$2a$10$wOqZqK72m8Y1.w941x2U2.a7tC0F.LzS6fE82c4QxH9z5vK0A6g1G', // Reception@123
      role: 'receptionist',
      phone: '+91 98844 55667',
      isActive: true
    }
  ],
  roomTypes: INITIAL_ROOM_TYPES.map(rt => ({ ...rt })),
  rooms: INITIAL_PHYSICAL_ROOMS.map(rm => ({ ...rm })),
  bookings: [],
  payments: [],
  reviews: [],
  maintenance: [],
  notifications: []
};

export const seedDatabase = async () => {
  try {
    const salt = await bcrypt.genSalt(10);
    const managerHash = await bcrypt.hash('Manager@123', salt);
    const receptionHash = await bcrypt.hash('Reception@123', salt);
    const customerHash = await bcrypt.hash('Customer@123', salt);

    const initialUsers = [
      {
        userId: 'usr-mgr-1',
        uid: 'usr-mgr-1',
        name: 'General Manager',
        email: 'manager@hotelsaravana.com',
        password: managerHash,
        role: 'manager',
        phone: '+91 94433 11223',
        isActive: true
      },
      {
        userId: 'usr-rec-1',
        uid: 'usr-rec-1',
        name: 'Desk Receptionist',
        email: 'receptionist@hotelsaravana.com',
        password: receptionHash,
        role: 'receptionist',
        phone: '+91 98844 55667',
        isActive: true
      },
      {
        userId: 'usr-cust-1',
        uid: 'usr-cust-1',
        name: 'Karthik Raman',
        email: 'customer@gmail.com',
        password: customerHash,
        role: 'customer',
        phone: '+91 98765 43210',
        isActive: true
      }
    ];

    memoryStore.users = initialUsers.map(u => ({ ...u }));

    // ONLY attempt MongoDB calls if actually connected (readyState === 1) to avoid buffer timeout
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        await HotelConfig.updateOne(
          { hotelId: INITIAL_HOTEL_DATA.hotelId },
          { $setOnInsert: INITIAL_HOTEL_DATA },
          { upsert: true }
        );

        for (const u of initialUsers) {
          await User.updateOne({ email: u.email }, { $set: u }, { upsert: true });
        }

        for (const rt of INITIAL_ROOM_TYPES) {
          await RoomType.updateOne({ typeId: rt.typeId }, { $set: rt }, { upsert: true });
        }

        for (const rm of INITIAL_PHYSICAL_ROOMS) {
          await Room.updateOne({ roomNumber: rm.roomNumber }, { $set: rm }, { upsert: true });
        }
      } catch (dbErr) {
        console.warn('DB upsert notice:', dbErr.message);
      }
    }
  } catch (err) {
    console.error('Data repository initialization notice:', err);
  }
};
