const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const env = require('../config/env');

async function findOrCreateUser(profile, requestedRole = 'VIEWER') {
  const email = profile.emails?.[0]?.value || profile.email;
  const googleId = profile.id || profile.googleId;

  if (!email || !googleId) {
    throw new Error('Google profile is missing required fields.');
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  const role = requestedRole === 'ADMIN' && env.adminEmails.includes(email.toLowerCase())
    ? 'ADMIN'
    : 'VIEWER';

  if (requestedRole === 'ADMIN' && role !== 'ADMIN') {
    const error = new Error('This Google account is not authorized for admin access.');
    error.code = 'ADMIN_NOT_ALLOWED';
    throw error;
  }

  if (existingUser) {

    if (existingUser.role !== role) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { role },
      });
    }

    return { ...existingUser, role };
  }

  const user = await prisma.user.create({
    data: {
      googleId,
      name: profile.displayName || 'User',
      email,
      avatarUrl: profile.photos?.[0]?.value || null,
      role,
    },
  });

  return user;
}

function signJwt(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      avatarUrl: user.avatarUrl,
    },
    env.jwtSecret,
    { expiresIn: '7d' },
  );
}

module.exports = { findOrCreateUser, signJwt };
