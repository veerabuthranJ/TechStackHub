const express = require('express');
const passport = require('passport');
const { sendSuccess, sendError } = require('../utils/response');
const prisma = require('../config/prisma');
const authenticate = require('../middleware/authenticate');
const env = require('../config/env');
const { signJwt } = require('../services/authService');

const router = express.Router();
const crossSiteCookies = env.clientUrl.startsWith('https://');

router.get('/google', (req, res, next) => {
  const requestedRole = req.query.role === 'ADMIN' ? 'ADMIN' : 'VIEWER';

  res.clearCookie('jwt', {
    httpOnly: true,
    secure: crossSiteCookies,
    sameSite: crossSiteCookies ? 'none' : 'lax',
  });

  res.cookie('oauth_role', requestedRole, {
    httpOnly: true,
    secure: crossSiteCookies,
    sameSite: crossSiteCookies ? 'none' : 'lax',
    maxAge: 10 * 60 * 1000,
  });

  return passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account',
  })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', async (err, user) => {
    if (err || !user) {
      if (err) {
        console.error('Google OAuth callback failed:', {
          code: err.code,
          message: err.message,
          name: err.name,
        });
      } else {
        console.error('Google OAuth callback returned no user.');
      }

      res.clearCookie('oauth_role');

      if (err?.code === 'ADMIN_NOT_ALLOWED') {
        return res.redirect(`${env.clientUrl}/login?error=admin_not_allowed`);
      }

      return res.redirect(`${env.clientUrl}/login?error=google_auth_failed`);
    }

    try {
      res.clearCookie('oauth_role');
      const token = signJwt(user);
      res.cookie('jwt', token, {
        httpOnly: true,
        secure: crossSiteCookies,
        sameSite: crossSiteCookies ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.redirect(`${env.clientUrl}/dashboard`);
    } catch (error) {
      return next(error);
    }
  })(req, res, next);
});

router.get('/me', authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });

  if (!user) {
    return sendError(res, 'User not found.', 404);
  }

  return sendSuccess(res, {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
  });
});

router.post('/logout', (req, res) => {
  res.clearCookie('jwt', {
    httpOnly: true,
    secure: crossSiteCookies,
    sameSite: crossSiteCookies ? 'none' : 'lax',
  });

  return sendSuccess(res, { loggedOut: true });
});

module.exports = router;
