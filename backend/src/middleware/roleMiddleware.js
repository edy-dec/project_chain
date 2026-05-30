// Guard-ul verifica rolul dupa ce userul a fost atasat pe request.
const requireRole = (allowedRoles) => (req, res, next) => {
  if (!req.currentUser) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  if (!allowedRoles.includes(req.currentUser.role)) {
    return res.status(403).json({ success: false, error: 'Insufficient permissions' });
  }

  return next();
};

module.exports = { requireRole };
