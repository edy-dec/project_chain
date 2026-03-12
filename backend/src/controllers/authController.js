const userService = require('../services/userService');
const { success, error } = require('../utils/responseHelper');

const syncUser = async (req, res, next) => {
  try {
    const auth0Id = req.auth.sub;

    // Priority: token claims → namespaced claims → request body (from ID token on frontend)
    const email = req.auth.email
      || req.auth['https://chain-api/email']
      || req.body?.email;
    const name = req.auth.name
      || req.auth['https://chain-api/name']
      || req.body?.name
      || '';

    console.log(`[AUTH SYNC] auth0Id=${auth0Id}, email=${email || 'MISSING'}, source=${
      req.auth.email ? 'token' : req.auth['https://chain-api/email'] ? 'namespace' : req.body?.email ? 'body' : 'none'
    }`);

    if (!email) {
      return error(res, 'Email not available. Ensure Auth0 is configured or retry login.', 400);
    }

    const user = await userService.syncAuth0User(auth0Id, email, name);
    console.log(`[AUTH SYNC] Synced → id=${user.id}, role=${user.role}, email=${user.email}`);
    return success(res, { user }, 'User synced successfully');
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const { sub: auth0Id } = req.auth;
    const user = await userService.findByAuth0Id(auth0Id);
    if (!user) return error(res, 'User not registered in system', 401);
    return success(res, { user });
  } catch (err) {
    next(err);
  }
};

module.exports = { syncUser, getMe };
