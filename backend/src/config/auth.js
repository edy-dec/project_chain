const { expressjwt: jwt } = require('express-jwt');
const jwksRsa = require('jwks-rsa');

/**
 * Auth0 JWT validation middleware.
 * Validates RS256 tokens issued by the configured Auth0 tenant.
 */
const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
  }),
  audience: process.env.AUTH0_AUDIENCE,
  issuer: `https://${process.env.AUTH0_DOMAIN}/`,
  algorithms: ['RS256'],
});

module.exports = { checkJwt };
