import { hasValidUploadSignature, isAllowedUpload } from './upload-validation';

describe('case upload validation', () => {
  it('rejects an executable extension even with an image MIME type', () => {
    expect(isAllowedUpload('payload.html', 'image/png')).toBe(false);
    expect(isAllowedUpload('image.png', 'image/png')).toBe(true);
    expect(isAllowedUpload('image.png', 'text/html')).toBe(false);
  });

  it('rejects spoofed file contents', () => {
    expect(hasValidUploadSignature('.png', Buffer.from('<html>attack</html>'))).toBe(false);
    expect(hasValidUploadSignature('.png', Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe(true);
  });
});
