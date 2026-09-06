const { S3Client, GetObjectCommand, HeadObjectCommand, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { randomUUID } = require('crypto');
const env = require('../config/env');

const s3 = new S3Client({
  region: env.awsRegion,
  credentials: {
    accessKeyId: env.awsAccessKeyId,
    secretAccessKey: env.awsSecretAccessKey,
  },
});

const settings = {
  VIDEO: {
    mimeTypes: ['video/mp4', 'video/webm', 'video/quicktime', 'video/ogg', 'video/mpeg'],
    extensions: ['.mp4', '.webm', '.mov', '.ogv', '.mpeg', '.mpg'],
    maxBytes: 100 * 1024 * 1024,
  },
  PDF: { mimeTypes: ['application/pdf'], extensions: ['.pdf'], maxBytes: 20 * 1024 * 1024 },
  HTML: { mimeTypes: ['text/html', 'application/xhtml+xml'], extensions: ['.html', '.htm'], maxBytes: 5 * 1024 * 1024 },
};

const mimeTypesByExtension = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.ogv': 'video/ogg',
  '.mpeg': 'video/mpeg',
  '.mpg': 'video/mpeg',
  '.pdf': 'application/pdf',
  '.html': 'text/html',
  '.htm': 'text/html',
};

function getFileExtension(file) {
  const name = file.originalname || '';
  const extension = name.slice(name.lastIndexOf('.')).toLowerCase();
  return extension === name ? '' : extension;
}

function getMimeTypeFromKey(key, fallback = 'application/octet-stream') {
  const extension = getFileExtension({ originalname: key });
  return mimeTypesByExtension[extension] || fallback;
}

function getContentType(file) {
  const mime = (file.mimetype || '').toLowerCase();
  const extension = getFileExtension(file);

  for (const [type, config] of Object.entries(settings)) {
    if (config.mimeTypes.includes(mime) || config.extensions.includes(extension)) {
      return type;
    }
  }

  return null;
}

function validateFile(file) {
  if (!file) {
    return { valid: false, message: 'A file is required.' };
  }

  const type = getContentType(file);
  if (!type) {
    return { valid: false, message: 'Only MP4, PDF, and HTML files are supported.' };
  }

  const { maxBytes } = settings[type];
  if (file.size > maxBytes) {
    return { valid: false, message: `The uploaded ${type.toLowerCase()} exceeds the allowed size limit.` };
  }

  return { valid: true, type };
}

function buildStorageKey(type, file) {
  const fallbackExtensions = { VIDEO: '.mp4', PDF: '.pdf', HTML: '.html' };
  const extension = getFileExtension(file);
  const storedExtension = settings[type].extensions.includes(extension) ? extension : fallbackExtensions[type];
  return `${type.toLowerCase()}s/${randomUUID()}${storedExtension}`;
}

async function uploadToS3(file, key) {
  const contentType = mimeTypesByExtension[getFileExtension(file)] || file.mimetype || 'application/octet-stream';

  await s3.send(new PutObjectCommand({
    Bucket: env.awsS3Bucket,
    Key: key,
    Body: file.buffer,
    ContentType: contentType,
    ACL: 'private',
  }));
}

async function deleteFromS3(key) {
  await s3.send(new DeleteObjectCommand({
    Bucket: env.awsS3Bucket,
    Key: key,
  }));
}

async function getObjectMetadata(key) {
  return s3.send(new HeadObjectCommand({ Bucket: env.awsS3Bucket, Key: key }));
}

async function streamObject(key, range) {
  const params = { Bucket: env.awsS3Bucket, Key: key };
  if (range) params.Range = range;
  return s3.send(new GetObjectCommand(params));
}

module.exports = {
  settings,
  getContentType,
  getMimeTypeFromKey,
  validateFile,
  buildStorageKey,
  uploadToS3,
  deleteFromS3,
  getObjectMetadata,
  streamObject,
};
