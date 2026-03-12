/**
 * Role-based access guard.
 * Usage: requireRole(['admin', 'manager'])
 */
const requireRole = (allowedRoles) => (req, res, next) => {
  if (!req.currentUser) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  if (!allowedRoles.includes(req.currentUser.role)) {
    return res.status(403).json({ success: false, error: 'Insufficient permissions' });
  }
  next();
};

module.exports = { requireRole };
