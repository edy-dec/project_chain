const userService = require('../services/userService');

const getAuthIdentity = (req) => {
  const auth = req.auth || {};

  return {
    auth0Id: auth.sub,
    email: auth.email || auth['https://chain-api/email'],
    name: auth.name || auth['https://chain-api/name'] || '',
  };
};

const attachUser = async (req, res, next) => {
  try {
    const { auth0Id, email, name } = getAuthIdentity(req);

    if (!auth0Id) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    let user = await userService.findByAuth0Id(auth0Id);

    // Daca userul nu este sincronizat inca, il legam automat la primul request.
    if (!user) {
      if (!email) {
        return res.status(401).json({ success: false, error: 'User not registered in system' });
      }

      user = await userService.syncAuth0User(auth0Id, email, name);
    }

    if (user.status === 'inactive') {
      return res.status(403).json({ success: false, error: 'Account deactivated' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ success: false, error: 'Account suspended' });
    }

    req.currentUser = user;
    return next();
  } catch (err) {
    return next(err);
  }
};

module.exports = { attachUser };
