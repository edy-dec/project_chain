const notFound = (req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.originalUrl} not found` });
};

const errorHandler = (err, req, res, _next) => {
  console.error(`[Error] ${err.name}: ${err.message}`);

  // JWT / Auth0
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
  // Sequelize validation
  if (err.name === 'SequelizeValidationError') {
    const messages = err.errors.map((e) => e.message);
    return res.status(400).json({ success: false, error: messages.join(', ') });
  }
  // Unique constraint
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({ success: false, error: 'Record already exists' });
  }
  // FK violation
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({ success: false, error: 'Referenced record does not exist' });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({ success: false, error: err.message || 'Internal Server Error' });
};

module.exports = { notFound, errorHandler };
