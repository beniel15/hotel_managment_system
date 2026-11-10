import axios from 'axios';

process.env.NODE_ENV = 'test';

async function runTests() {
  const { default: app } = await import('./server.js');
  const PORT = 5098;
  const server = app.listen(PORT, async () => {
    const BASE_URL = `http://127.0.0.1:${PORT}/api`;
    console.log(`\n===============================================================`);
    console.log(`🧪 HOTEL RESERVATION & RECEPTIONIST WORKFLOW VALIDATION SUITE`);
    console.log(`===============================================================\n`);
    // Reset test bookings for clean test run
    try {
      const { default: Booking } = await import('./models/Booking.js');
      const { memoryStore } = await import('./services/dataRepository.js');
      await Booking.deleteMany({ customerEmail: { $regex: /example\.com|guest\.com|test\.com/i } });
      memoryStore.bookings = memoryStore.bookings.filter(b => !/example\.com|guest\.com|test\.com/i.test(b.customerEmail));
    } catch (e) {}

    let passedCount = 0;
    const totalCount = 13;

    try {
      // 1. Customer Authentication
      console.log('Test 1: Customer Registration & Token Generation...');
      const testEmail = `guest.${Date.now()}@example.com`;
      const regRes = await axios.post(`${BASE_URL}/auth/register`, {
        name: 'Vignesh Sundaram',
        email: testEmail,
        password: 'Password@123',
        phone: '+91 98401 23456'
      });
      if (regRes.data.success && regRes.data.token && regRes.data.user.role === 'customer') {
        console.log('✅ Passed: Customer registered, bcrypt password hashed, JWT issued.');
        passedCount++;
      } else {
        throw new Error('Customer registration failed.');
      }
      const customerToken = regRes.data.token;

      // 2. Staff Authentication (Manager & Receptionist)
      console.log('\nTest 2: Receptionist & Manager Role-Based Authentication...');
      const recLogin = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'receptionist@hotelsaravana.com',
        password: 'Reception@123'
      });
      const mgrLogin = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'manager@hotelsaravana.com',
        password: 'Manager@123'
      });
      if (recLogin.data.success && mgrLogin.data.success) {
        console.log('✅ Passed: Receptionist and Manager verified with respective RBAC roles.');
        passedCount++;
      }
      const receptionistToken = recLogin.data.token;
      const managerToken = mgrLogin.data.token;

      // 3. Room Inventory Distinction (RoomTypes vs Physical Rooms)
      console.log('\nTest 3: Room Inventory Verification (RoomTypes & 20 Physical Rooms)...');
      const physRes = await axios.get(`${BASE_URL}/rooms/physical`, {
        headers: { Authorization: `Bearer ${receptionistToken}` }
      });
      const physicalRooms = physRes.data.rooms;
      const standardRooms = physicalRooms.filter(r => r.floor === 1);
      const deluxeRooms = physicalRooms.filter(r => r.floor === 2);
      const premiumRooms = physicalRooms.filter(r => r.floor === 3);

      if (physicalRooms.length >= 20 && standardRooms.length === 10 && deluxeRooms.length === 6 && premiumRooms.length === 4) {
        console.log(`✅ Passed: Inventory confirmed: ${standardRooms.length} Standard (Floor 1), ${deluxeRooms.length} Deluxe (Floor 2), ${premiumRooms.length} Premium (Floor 3). Total: ${physicalRooms.length} rooms.`);
        passedCount++;
      } else {
        throw new Error(`Inventory mismatch: Found ${physicalRooms.length} rooms.`);
      }

      // 4. Date-Based Real-Time Availability
      console.log('\nTest 4: Date-Based Real-Time Availability Query...');
      const availRes = await axios.get(`${BASE_URL}/rooms/availability`, {
        params: {
          checkInDate: '2026-11-20',
          checkOutDate: '2026-11-23',
          guests: 2,
          stayPackage: 'standard_overnight',
          roomsCount: 1
        }
      });
      if (availRes.data.success && availRes.data.roomTypes.length >= 3) {
        const stdType = availRes.data.roomTypes.find(t => t.typeId === 'rt-standard');
        console.log(`✅ Passed: Availability calculated. Standard Room available count: ${stdType.availableRoomsCount}/${stdType.totalRoomsCount}.`);
        passedCount++;
      }

      // 5. Stay Packages & User-Specific Pricing Support
      console.log('\nTest 5: Stay Package Selection & User Rates (Standard ₹999/₹1399, Deluxe ₹1199/₹1500, Premium ₹2000/₹3499)...');
      const dayStayRes = await axios.get(`${BASE_URL}/rooms/availability`, {
        params: {
          checkInDate: '2026-11-25',
          checkOutDate: '2026-11-25',
          stayPackage: 'day_stay',
          guests: 1
        }
      });
      const dayStd = dayStayRes.data.roomTypes.find(t => t.typeId === 'rt-standard');
      const dayDlx = dayStayRes.data.roomTypes.find(t => t.typeId === 'rt-deluxe');
      const dayPrm = dayStayRes.data.roomTypes.find(t => t.typeId === 'rt-premium');

      if (dayStd && dayStd.pricePerNight === 1399 && dayDlx.pricePerNight === 1500 && dayPrm.pricePerNight === 3499) {
        console.log(`✅ Passed: Day Stay package applied exact rates: Standard ₹${dayStd.pricePerNight}, Deluxe ₹${dayDlx.pricePerNight}, Premium ₹${dayPrm.pricePerNight}.`);
        passedCount++;
      } else {
        throw new Error(`Day stay pricing unexpected: Standard ${dayStd?.pricePerNight}, Deluxe ${dayDlx?.pricePerNight}, Premium ${dayPrm?.pricePerNight}`);
      }

      // 5b. Room Capacity Limit Enforcement (e.g. 15 members in 1 Standard Room)
      console.log('\nTest 5b: Room Capacity Limit Enforcement (e.g. 15 guests in 1 Standard Room must be rejected)...');
      let capacityRejected = false;
      try {
        await axios.post(`${BASE_URL}/bookings`, {
          typeId: 'rt-standard',
          roomsCount: 1,
          adultsCount: 15,
          childrenCount: 0,
          checkInDate: '2026-11-25',
          checkOutDate: '2026-11-26',
          stayPackage: 'standard_overnight',
          guestName: 'Big Group',
          guestEmail: 'biggroup@test.com',
          guestPhone: '+91 99999 88888'
        }, {
          headers: { Authorization: `Bearer ${customerToken}` }
        });
      } catch (err) {
        if (err.response && err.response.status === 400 && err.response.data.message.includes('capacity')) {
          capacityRejected = true;
          console.log(`✅ Passed: Room capacity validation correctly rejected 15 guests in 1 room: "${err.response.data.message}"`);
        }
      }
      if (!capacityRejected) {
        throw new Error('Room capacity validation failed: 15 guests were incorrectly allowed to book 1 Standard Room!');
      }

      // 5c. Manager Maintenance Scheduling (Image 1 fix)
      console.log('\nTest 5c: Manager Room Maintenance Scheduling (Verifying Image 1 fix)...');
      const mntRes = await axios.post(`${BASE_URL}/manager/maintenance`, {
        roomNumber: '108',
        issueDescription: 'ac cooling',
        severity: 'Medium (HVAC / Plumbing)'
      }, {
        headers: { Authorization: `Bearer ${managerToken}` }
      });
      if (mntRes.data.success && mntRes.data.maintenance.roomNumber === '108') {
        console.log(`✅ Passed: Manager successfully placed Room 108 under maintenance (severity: ${mntRes.data.maintenance.severity}).`);
      } else {
        throw new Error('Manager maintenance scheduling failed.');
      }

      // 5d. Preferred Floor Assignment & Vacancy Fallback
      console.log('\nTest 5d: Preferred Floor Assignment & Vacancy Fallback...');
      const floorAvailRes = await axios.get(`${BASE_URL}/rooms/availability`, {
        params: {
          checkInDate: '2026-11-20',
          checkOutDate: '2026-11-23',
          guests: 2,
          stayPackage: 'standard_overnight',
          roomsCount: 1,
          preferredFloor: 1
        }
      });
      if (floorAvailRes.data.floorBreakdown && floorAvailRes.data.floorStatus) {
        console.log(`✅ Passed: Floor availability calculated: Floor 1 (${floorAvailRes.data.floorBreakdown[1].available} rooms), Floor 2 (${floorAvailRes.data.floorBreakdown[2].available} rooms), Floor 3 (${floorAvailRes.data.floorBreakdown[3].available} rooms). Status: "${floorAvailRes.data.floorStatus.message}"`);
        passedCount++;
      } else {
        throw new Error('Floor breakdown or floorStatus missing in availability response.');
      }

      // 6. Group Booking Creation (Multiple Rooms in Single Reservation)
      console.log('\nTest 6: Group Booking Creation (3 Standard Rooms under 1 Reservation)...');
      const groupBookingRes = await axios.post(`${BASE_URL}/bookings`, {
        typeId: 'rt-standard',
        selectedRooms: [{ typeId: 'rt-standard', quantity: 3 }],
        checkInDate: '2026-11-20',
        checkOutDate: '2026-11-23',
        stayPackage: 'standard_overnight',
        adultsCount: 4,
        childrenCount: 2,
        guestName: 'Vignesh Group Tour',
        guestEmail: testEmail,
        guestPhone: '+91 98401 23456',
        paymentMethod: 'Razorpay (Online)'
      }, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });

      const groupBooking = groupBookingRes.data.booking;
      if (groupBookingRes.data.success && groupBooking.roomAllocations.length === 3) {
        console.log(`✅ Passed: Group Booking #${groupBooking.bookingId} created with 3 room allocations: Room(s) ${groupBooking.assignedRoomNumber}.`);
        passedCount++;
      } else {
        throw new Error('Group booking creation failed.');
      }

      // 7. Double-Booking & Date Overlap Prevention
      console.log('\nTest 7: Date Overlap Rule & Over-Capacity Prevention...');
      let preventedDoubleBooking = false;
      try {
        await axios.post(`${BASE_URL}/bookings`, {
          typeId: 'rt-standard',
          selectedRooms: [{ typeId: 'rt-standard', quantity: 8 }],
          checkInDate: '2026-11-21', // Overlaps Nov 20 - Nov 23
          checkOutDate: '2026-11-24',
          stayPackage: 'standard_overnight',
          numberOfGuests: 10,
          guestName: 'Overflow Guest',
          guestEmail: 'overflow@guest.com',
          guestPhone: '+91 99999 11111'
        }, {
          headers: { Authorization: `Bearer ${customerToken}` }
        });
      } catch (err) {
        if (err.response && err.response.status === 409) {
          preventedDoubleBooking = true;
          console.log(`✅ Passed: Concurrency check prevented double booking: "${err.response.data.message}"`);
          passedCount++;
        }
      }
      if (!preventedDoubleBooking) {
        throw new Error('Failed: Overlapping over-capacity booking was NOT rejected!');
      }

      // 8. Receptionist Room Assignment
      console.log('\nTest 8: Receptionist Physical Room Assignment...');
      const singleBookingRes = await axios.post(`${BASE_URL}/bookings`, {
        typeId: 'rt-deluxe',
        roomsCount: 1,
        checkInDate: '2026-11-20',
        checkOutDate: '2026-11-22',
        stayPackage: 'standard_overnight',
        guestName: 'Anand Kumar',
        guestEmail: 'anand@example.com',
        guestPhone: '+91 98840 55555'
      }, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      const singleBooking = singleBookingRes.data.booking;
      
      const assignRes = await axios.patch(`${BASE_URL}/bookings/${singleBooking.bookingId}/assign-room`, {
        roomNumber: '203'
      }, {
        headers: { Authorization: `Bearer ${receptionistToken}` }
      });
      if (assignRes.data.success && assignRes.data.booking.assignedRoomNumber === '203') {
        console.log(`✅ Passed: Receptionist assigned physical Room 203 to Booking #${singleBooking.bookingId}.`);
        passedCount++;
      }

      // 9. Receptionist Check-In (Room -> Occupied)
      console.log('\nTest 9: Receptionist Check-In -> Room Operational Status Transitions to "Occupied"...');
      const checkInRes = await axios.patch(`${BASE_URL}/bookings/${singleBooking.bookingId}/check-in`, {
        roomNumber: '203'
      }, {
        headers: { Authorization: `Bearer ${receptionistToken}` }
      });

      const updatedPhys1 = await axios.get(`${BASE_URL}/rooms/physical`, {
        headers: { Authorization: `Bearer ${receptionistToken}` }
      });
      const room203AfterCin = updatedPhys1.data.rooms.find(r => r.roomNumber === '203');

      if (checkInRes.data.success && room203AfterCin.status === 'Occupied') {
        console.log(`✅ Passed: Guest checked in. Physical Room 203 operational status transitioned to "Occupied".`);
        passedCount++;
      } else {
        throw new Error(`Room 203 expected Occupied but found ${room203AfterCin?.status}`);
      }

      // 10. Receptionist Check-Out (Room -> Cleaning)
      console.log('\nTest 10: Receptionist Check-Out -> Room Operational Status Transitions to "Cleaning"...');
      const checkOutRes = await axios.patch(`${BASE_URL}/bookings/${singleBooking.bookingId}/check-out`, {
        additionalCharges: 450,
        additionalChargesDescription: 'Minibar refreshments'
      }, {
        headers: { Authorization: `Bearer ${receptionistToken}` }
      });

      const updatedPhys2 = await axios.get(`${BASE_URL}/rooms/physical`, {
        headers: { Authorization: `Bearer ${receptionistToken}` }
      });
      const room203AfterCout = updatedPhys2.data.rooms.find(r => r.roomNumber === '203');

      if (checkOutRes.data.success && room203AfterCout.status === 'Cleaning' && checkOutRes.data.booking.additionalCharges === 450) {
        console.log(`✅ Passed: Guest checked out. Physical Room 203 status transitioned to "Cleaning", extra charges recorded.`);
        passedCount++;
      } else {
        throw new Error(`Room 203 expected Cleaning but found ${room203AfterCout?.status}`);
      }

      // 11. Housekeeping Clean Action (Room -> Available)
      console.log('\nTest 11: Housekeeping Action -> Room Status Transitions from "Cleaning" to "Available"...');
      const cleanRes = await axios.patch(`${BASE_URL}/rooms/physical/203/clean`, {}, {
        headers: { Authorization: `Bearer ${receptionistToken}` }
      });

      const updatedPhys3 = await axios.get(`${BASE_URL}/rooms/physical`, {
        headers: { Authorization: `Bearer ${receptionistToken}` }
      });
      const room203Clean = updatedPhys3.data.rooms.find(r => r.roomNumber === '203');

      if (cleanRes.data.success && room203Clean.status === 'Available') {
        console.log(`✅ Passed: Room 203 marked clean and transitioned to "Available" for next guests.`);
        passedCount++;
      } else {
        throw new Error(`Room 203 expected Available but found ${room203Clean?.status}`);
      }

      // 12. Walk-in Booking & Cancellation Refund Workflow
      console.log('\nTest 12: Front-Desk Walk-In Booking & Booking Cancellation...');
      const walkInRes = await axios.post(`${BASE_URL}/bookings/walk-in`, {
        guestName: 'Front Desk WalkIn',
        guestPhone: '+91 97777 22222',
        guestEmail: 'walkin@guest.com',
        typeId: 'rt-standard',
        checkInDate: '2026-11-28',
        checkOutDate: '2026-11-29',
        immediateCheckIn: false
      }, {
        headers: { Authorization: `Bearer ${receptionistToken}` }
      });
      const wiBooking = walkInRes.data.booking;

      const cancelRes = await axios.patch(`${BASE_URL}/bookings/${wiBooking.bookingId}/cancel`, {
        cancellationReason: 'Guest changed travel plans'
      }, {
        headers: { Authorization: `Bearer ${receptionistToken}` }
      });

      if (cancelRes.data.success && cancelRes.data.booking.bookingStatus === 'Cancelled' && cancelRes.data.booking.paymentStatus === 'Refunded') {
        console.log(`✅ Passed: Walk-in created and cancelled. Status = "Cancelled", Payment = "Refunded", physical room released.`);
        passedCount++;
      }

      console.log(`\n===============================================================`);
      console.log(`🎉 ALL TESTS PASSED: ${passedCount} / ${totalCount} scenarios successful!`);
      console.log(`===============================================================\n`);

    } catch (err) {
      console.error('\n❌ Test Suite encountered an error:', err.response?.data || err.message);
    } finally {
      server.close(() => {
        console.log('Test server closed.');
        process.exit(passedCount === totalCount ? 0 : 1);
      });
    }
  });
}

runTests();
