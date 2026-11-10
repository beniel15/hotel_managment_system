import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { memoryStore } from '../services/dataRepository.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey_hotel_booking_100users';

// Helper to issue JWT
const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.userId,
      email: user.email,
      role: user.role,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// 1. REGISTER CUSTOMER
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists in DB or memoryStore
    let existingUser = null;
    try {
      existingUser = await User.findOne({ email: normalizedEmail });
    } catch (e) {
      existingUser = memoryStore.users.find(u => u.email.toLowerCase() === normalizedEmail);
    }

    if (existingUser) {
      return res.status(409).json({ success: false, message: 'An account with this email address already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUserId = 'usr-' + Math.random().toString(36).substring(2, 9);

    const userData = {
      userId: newUserId,
      uid: newUserId,
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: 'customer',
      phone: phone || '+91 98765 43210',
      isActive: true,
      photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${normalizedEmail}`
    };

    try {
      await User.create(userData);
    } catch (dbErr) {
      console.warn('MongoDB User.create fallback to memoryStore:', dbErr.message);
    }
    memoryStore.users.push({ ...userData });

    const token = generateToken(userData);

    res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome to Hotel Saravana Grand.',
      token,
      user: {
        userId: userData.userId,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        phone: userData.phone,
        photoURL: userData.photoURL
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. LOGIN (Customer, Receptionist, Manager)
router.post('/login', async (req, res) => {
  try {
    const { email, password, expectedRole } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    let user = null;
    try {
      user = await User.findOne({ email: normalizedEmail });
    } catch (e) {
      user = memoryStore.users.find(u => u.email.toLowerCase() === normalizedEmail);
    }

    if (!user) {
      // Check memory store if MongoDB didn't have it
      user = memoryStore.users.find(u => u.email.toLowerCase() === normalizedEmail);
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (user.isActive === false) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated. Please contact hotel management.' });
    }

    // Role check if the login page is role-specific
    if (expectedRole && user.role !== expectedRole) {
      // Allow manager to access any portal, otherwise reject
      if (user.role !== 'manager') {
        return res.status(403).json({
          success: false,
          message: `Access denied. This portal is for ${expectedRole} accounts only. Your account role is ${user.role}.`
        });
      }
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        photoURL: user.photoURL
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. GOOGLE SIGN-IN VERIFICATION (Issues backend JWT)
router.post('/verify-google-token', async (req, res) => {
  try {
    const { email, displayName, photoURL, role } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required from OAuth provider.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = null;

    try {
      user = await User.findOne({ email: normalizedEmail });
    } catch (e) {
      user = memoryStore.users.find(u => u.email.toLowerCase() === normalizedEmail);
    }

    if (!user) {
      user = memoryStore.users.find(u => u.email.toLowerCase() === normalizedEmail);
    }

    if (!user) {
      const newUserId = 'usr-g-' + Math.random().toString(36).substring(2, 9);
      const salt = await bcrypt.genSalt(10);
      const randomPassword = await bcrypt.hash(Math.random().toString(), salt);

      const newUserData = {
        userId: newUserId,
        name: displayName || normalizedEmail.split('@')[0],
        email: normalizedEmail,
        password: randomPassword,
        role: role === 'manager' || role === 'receptionist' ? role : 'customer',
        phone: '+91 98765 43210',
        isActive: true,
        photoURL: photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${normalizedEmail}`
      };

      try {
        await User.create(newUserData);
      } catch (dbErr) {
        console.warn('MongoDB User.create fallback:', dbErr.message);
      }
      memoryStore.users.push({ ...newUserData });
      user = newUserData;
    }

    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        photoURL: user.photoURL
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. GET CURRENT USER PROFILE
router.get('/me', authenticateToken, async (req, res) => {
  try {
    let user = null;
    try {
      user = await User.findOne({ userId: req.user.userId }).select('-password');
    } catch (e) {
      user = memoryStore.users.find(u => u.userId === req.user.userId);
    }

    if (!user) {
      user = memoryStore.users.find(u => u.userId === req.user.userId);
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User profile not found.' });
    }

    res.json({
      success: true,
      user: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        photoURL: user.photoURL,
        isActive: user.isActive
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. UPDATE USER PROFILE
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, phone, photoURL } = req.body;
    const updateFields = {};
    if (name) updateFields.name = name.trim();
    if (phone) updateFields.phone = phone.trim();
    if (photoURL) updateFields.photoURL = photoURL;

    let updatedUser = null;
    try {
      updatedUser = await User.findOneAndUpdate(
        { userId: req.user.userId },
        { $set: updateFields },
        { new: true }
      ).select('-password');
    } catch (e) {
      console.warn('DB update fallback:', e.message);
    }

    // Update in memoryStore
    const memUser = memoryStore.users.find(u => u.userId === req.user.userId);
    if (memUser) {
      if (name) memUser.name = name.trim();
      if (phone) memUser.phone = phone.trim();
      if (photoURL) memUser.photoURL = photoURL;
      if (!updatedUser) updatedUser = memUser;
    }

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        userId: updatedUser.userId,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        phone: updatedUser.phone,
        photoURL: updatedUser.photoURL
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 6. CHANGE PASSWORD
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    let user = null;
    try {
      user = await User.findOne({ userId: req.user.userId });
    } catch (e) {
      user = memoryStore.users.find(u => u.userId === req.user.userId);
    }
    if (!user) user = memoryStore.users.find(u => u.userId === req.user.userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password does not match.' });
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    try {
      await User.updateOne({ userId: req.user.userId }, { $set: { password: newHash } });
    } catch (e) {
      console.warn('DB update password notice:', e.message);
    }

    const memUser = memoryStore.users.find(u => u.userId === req.user.userId);
    if (memUser) memUser.password = newHash;

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
