const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { sendError } = require('../utils/response');

function authenticate(req, res, next) {
  const token = req.cookies?.jwt;

  if (!token) {
    return sendError(res, 'Authentication required.', 401);
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    req.user = decoded;
    return next();
  } catch (error) {
    return sendError(res, 'Invalid or expired authentication token.', 401);
  }
}

module.exports = authenticate;
