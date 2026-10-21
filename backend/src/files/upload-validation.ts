import { extname } from 'path';

const MIME_BY_EXTENSION: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
  '.pdf': 'application/pdf',
};

export const uploadExtension = (name: string): string => extname(name || '').toLowerCase();

export const isAllowedUpload = (name: string, mime: string): boolean =>
  MIME_BY_EXTENSION[uploadExtension(name)] === mime;

export const hasValidUploadSignature = (extension: string, bytes: Buffer): boolean => {
  const startsWith = (...values: number[]) => values.every((value, index) => bytes[index] === value);
  switch (extension) {
    case '.jpg':
    case '.jpeg':
      return startsWith(0xff, 0xd8, 0xff);
    case '.png':
      return startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
    case '.gif':
      return bytes.subarray(0, 6).toString('ascii') === 'GIF87a' || bytes.subarray(0, 6).toString('ascii') === 'GIF89a';
    case '.webp':
      return bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP';
    case '.mp4':
    case '.mov':
      return bytes.subarray(4, 8).toString('ascii') === 'ftyp';
    case '.avi':
      return bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'AVI ';
    case '.pdf':
      return bytes.subarray(0, 5).toString('ascii') === '%PDF-';
    default:
      return false;
  }
};
