const userService = require('../services/userService');
const { success, error } = require('../utils/responseHelper');

const getSyncIdentity = (req) => {
  const auth = req.auth || {};

  return {
    auth0Id: auth.sub,
    email: auth.email || auth['https://chain-api/email'] || req.body?.email,
    name: auth.name || auth['https://chain-api/name'] || req.body?.name || '',
    source: auth.email
      ? 'token'
      : auth['https://chain-api/email']
        ? 'namespace'
        : req.body?.email
          ? 'body'
          : 'none',
  };
};

const syncUser = async (req, res, next) => {
  try {
    // Luam datele din JWT si folosim body-ul doar ca fallback.
    const { auth0Id, email, name, source } = getSyncIdentity(req);

    console.log(`[AUTH SYNC] auth0Id=${auth0Id}, email=${email || 'MISSING'}, source=${source}`);

    if (!email) {
      return error(res, 'Email not available. Ensure Auth0 is configured or retry login.', 400);
    }

    const user = await userService.syncAuth0User(auth0Id, email, name);

    console.log(`[AUTH SYNC] synced -> id=${user.id}, role=${user.role}, email=${user.email}`);

    return success(res, { user }, 'User synced successfully');
  } catch (err) {
    return next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const { sub: auth0Id } = req.auth;
    const user = await userService.findByAuth0Id(auth0Id);

    if (!user) {
      return error(res, 'User not registered in system', 401);
    }

    return success(res, { user });
  } catch (err) {
    return next(err);
  }
};

const updateMe = async (req, res, next) => {
  try {
    const updatedUser = await userService.updateOwnProfile(req.currentUser.id, req.body || {});
    const user = await userService.findById(updatedUser.id);

    return success(res, { user }, 'Profile updated successfully');
  } catch (err) {
    return next(err);
  }
};

module.exports = { syncUser, getMe, updateMe };
