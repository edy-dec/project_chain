const userService = require('../services/userService');

/**
 * Resolves the authenticated Auth0 subject to a local DB User
 * and attaches it to `req.currentUser`.
 *
 * If the user is not found by auth0Id (e.g. the first login sync hasn't run yet),
 * it performs an auto-sync using the email/name from the JWT claims so the user
 * is never blocked by a missing link.
 */
const attachUser = async (req, res, next) => {
  try {
    const auth0Id = req.auth?.sub;
    if (!auth0Id) return res.status(401).json({ success: false, error: 'Unauthorized' });

    let user = await userService.findByAuth0Id(auth0Id);

    // Auto-sync: link or create the user on first authenticated request
    if (!user) {
      const email = req.auth?.email || req.auth?.['https://chain-api/email'];
      const name  = req.auth?.name  || req.auth?.['https://chain-api/name'] || '';
      if (!email) return res.status(401).json({ success: false, error: 'User not registered in system' });
      user = await userService.syncAuth0User(auth0Id, email, name);
    }

    if (user.status === 'inactive')  return res.status(403).json({ success: false, error: 'Account deactivated' });
    if (user.status === 'suspended') return res.status(403).json({ success: false, error: 'Account suspended' });

    req.currentUser = user;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { attachUser };
