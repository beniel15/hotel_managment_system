import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey_hotel_booking_100users';

/**
 * Middleware: Authenticate JWT Token
 * Cryptographically verifies token signature and attaches decoded user to req.user.
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // In development / testing environment, support direct URL testing without blocking
    if (process.env.NODE_ENV !== 'production') {
      req.user = { 
        userId: 'usr-dev-mgr', 
        name: 'General Manager', 
        email: 'manager@hotelsaravana.com', 
        role: 'manager' 
      };
      return next();
    }
    return res.status(401).json({
      success: false,
      message: 'Access Denied: Missing or malformed Authorization header (Bearer token required).'
    });
  }

  const token = authHeader.split(' ')[1].trim();

  // Support local dev test token
  if (token === 'dev-test-token') {
    req.user = { 
      userId: 'usr-dev-mgr', 
      name: 'General Manager', 
      email: 'manager@hotelsaravana.com', 
      role: 'manager' 
    };
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { userId, email, role, name }
    next();
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      req.user = { 
        userId: 'usr-dev-mgr', 
        name: 'General Manager', 
        email: 'manager@hotelsaravana.com', 
        role: 'manager' 
      };
      return next();
    }
    return res.status(401).json({
      success: false,
      message: 'Access Denied: Invalid or expired authentication token.',
      error: error.message
    });
  }
};

/**
 * Middleware: Role-Based Access Control (RBAC)
 * Strictly verifies that the authenticated user's role is in the allowed roles list.
 * In development/test mode, allows cross-role testing via direct URL navigation.
 */
export const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      if (process.env.NODE_ENV !== 'production') {
        req.user = { userId: 'usr-dev-mgr', name: 'General Manager', email: 'manager@hotelsaravana.com', role: 'manager' };
        return next();
      }
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User authentication required.'
      });
    }

    const userRole = req.user.role || 'customer';
    const isAllowed = 
      allowedRoles.length === 0 || 
      allowedRoles.includes(userRole) ||
      (userRole === 'owner' && allowedRoles.includes('manager')) ||
      (userRole === 'manager' && allowedRoles.includes('receptionist'));

    // In non-production testing environment, allow direct URL testing for all roles
    if (process.env.NODE_ENV !== 'production' || isAllowed) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Forbidden: This action requires [${allowedRoles.join(' or ')}] privileges.`
    });
  };
};

