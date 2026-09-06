const express = require('express');
const prisma = require('../config/prisma');
const authenticate = require('../middleware/authenticate');
const { sendSuccess, sendError } = require('../utils/response');
const { streamObject, getMimeTypeFromKey } = require('../services/s3Service');

const router = express.Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { search, category, type } = req.query;
    const where = {};

    if (search) {
      where.title = { contains: String(search), mode: 'insensitive' };
    }

    if (category) {
      where.category = { equals: String(category) };
    }

    if (type) {
      where.type = { equals: String(type) };
    }

    const contents = await prisma.content.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, contents);
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const content = await prisma.content.findUnique({ where: { id: req.params.id } });
    if (!content) return sendError(res, 'Content not found.', 404);
    return sendSuccess(res, content);
  } catch (error) {
    return next(error);
  }
});

router.get('/:id/stream', authenticate, async (req, res, next) => {
  try {
    const content = await prisma.content.findUnique({ where: { id: req.params.id } });
    if (!content) return sendError(res, 'Content not found.', 404);

    const range = req.headers.range || '';
    const object = await streamObject(content.storageKey, range || undefined);
    const size = object.ContentLength || 0;
    const contentType = getMimeTypeFromKey(content.storageKey, content.mimeType);
    const headers = {
      'Content-Type': contentType,
      'Content-Length': String(size),
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'private, no-store',
    };

    if (range) {
      const contentRange = object.ContentRange;
      if (!contentRange) {
        return sendError(res, 'The requested video range is invalid.', 416);
      }

      headers['Content-Range'] = contentRange;
      res.writeHead(206, headers);
    } else {
      res.writeHead(200, headers);
    }

    return object.Body.pipe(res);
  } catch (error) {
    if (error.name === 'InvalidRange' || error.$metadata?.httpStatusCode === 416) {
      return sendError(res, 'The requested video range is invalid.', 416);
    }
    return next(error);
  }
});

router.get('/:id/view', authenticate, async (req, res, next) => {
  try {
    const content = await prisma.content.findUnique({ where: { id: req.params.id } });
    if (!content) return sendError(res, 'Content not found.', 404);

    if (content.type === 'PDF') {
      const file = await streamObject(content.storageKey);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
      return file.Body.pipe(res);
    }

    if (content.type === 'HTML') {
      const file = await streamObject(content.storageKey);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return file.Body.pipe(res);
    }

    return sendError(res, 'This content type is not directly viewable.', 400);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
