const express = require('express');
const multer = require('multer');
const { z } = require('zod');
const prisma = require('../config/prisma');
const authenticate = require('../middleware/authenticate');
const requireAdmin = require('../middleware/requireAdmin');
const { sendSuccess, sendError } = require('../utils/response');
const { validateFile, buildStorageKey, uploadToS3, deleteFromS3, getObjectMetadata, streamObject } = require('../services/s3Service');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } });

const uploadSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  category: z.string().trim().min(1, 'Category is required'),
});

router.get('/content', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const contents = await prisma.content.findMany({ orderBy: { createdAt: 'desc' } });
    return sendSuccess(res, contents);
  } catch (error) {
    return next(error);
  }
});

router.post('/content', authenticate, requireAdmin, upload.single('file'), async (req, res, next) => {
  try {
    const validation = validateFile(req.file);
    if (!validation.valid) {
      return sendError(res, validation.message, 400);
    }

    const parsed = uploadSchema.safeParse({
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
    });

    if (!parsed.success) {
      return sendError(res, parsed.error.errors[0]?.message || 'Invalid metadata.', 400);
    }

    const key = buildStorageKey(validation.type, req.file);
    await uploadToS3(req.file, key);

    const content = await prisma.content.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description || '',
        type: validation.type,
        category: parsed.data.category,
        storageKey: key,
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        createdById: req.user.id,
      },
    });

    return sendSuccess(res, content, 201);
  } catch (error) {
    return next(error);
  }
});

router.put('/content/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const parsed = uploadSchema.pick({ title: true, description: true, category: true }).safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, parsed.error.errors[0]?.message || 'Invalid metadata.', 400);
    }

    const content = await prisma.content.findUnique({ where: { id: req.params.id } });
    if (!content) return sendError(res, 'Content not found.', 404);

    const updated = await prisma.content.update({
      where: { id: req.params.id },
      data: {
        title: parsed.data.title,
        description: parsed.data.description || '',
        category: parsed.data.category,
      },
    });

    return sendSuccess(res, updated);
  } catch (error) {
    return next(error);
  }
});

router.delete('/content/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const content = await prisma.content.findUnique({ where: { id: req.params.id } });
    if (!content) return sendError(res, 'Content not found.', 404);

    await deleteFromS3(content.storageKey);
    await prisma.content.delete({ where: { id: req.params.id } });

    return sendSuccess(res, { deleted: true, id: req.params.id });
  } catch (error) {
    return next(error);
  }
});

router.get('/content/:id/stream', authenticate, async (req, res, next) => {
  try {
    const content = await prisma.content.findUnique({ where: { id: req.params.id } });
    if (!content) return sendError(res, 'Content not found.', 404);

    const metadata = await getObjectMetadata(content.storageKey);
    const size = metadata.ContentLength || 0;
    const range = req.headers.range || '';

    if (range) {
      const match = /^bytes=(\d+)-?(\d+)?$/.exec(range);
      if (!match) return sendError(res, 'Invalid range header.', 416);

      const start = Number(match[1]);
      const end = Number.isFinite(Number(match[2])) ? Number(match[2]) : size - 1;
      const streamResponse = await streamObject(content.storageKey, `bytes=${start}-${end}`);

      res.writeHead(206, {
        'Content-Type': content.mimeType,
        'Content-Length': String(end - start + 1),
        'Content-Range': `bytes ${start}-${end}/${size}`,
        'Accept-Ranges': 'bytes',
      });

      return streamResponse.Body.pipe(res);
    }

    const streamResponse = await streamObject(content.storageKey);
    res.writeHead(200, {
      'Content-Type': content.mimeType,
      'Content-Length': String(size),
      'Accept-Ranges': 'bytes',
    });

    return streamResponse.Body.pipe(res);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
