export const checkRole = (allowedRoles = []) => {
  return (req, res, next) => {
    const userRole = req.headers['x-user-role'] || req.user?.role || 'user';
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        message: `Forbidden: Access requires ${allowedRoles.join(' or ')} permission.` 
      });
    }
    next();
  };
};
