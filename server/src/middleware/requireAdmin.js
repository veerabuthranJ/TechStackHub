const { sendError } = require('../utils/response');

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return sendError(res, 'Forbidden. Admin access required.', 403);
  }

  return next();
}

module.exports = requireAdmin;
