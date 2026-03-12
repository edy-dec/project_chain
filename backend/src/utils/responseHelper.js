const success = (res, data = null, message = 'Success', statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

const error = (res, message = 'Error', statusCode = 400) =>
  res.status(statusCode).json({ success: false, error: message });

const paginated = (res, items, total, page, totalPages) =>
  res.json({ success: true, data: items, pagination: { total, page, totalPages } });

module.exports = { success, error, paginated };
