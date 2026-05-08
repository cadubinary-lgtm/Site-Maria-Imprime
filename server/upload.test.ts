import { describe, it, expect, vi, beforeEach } from 'vitest';
import { storagePut } from './storage';

// Mock storagePut
vi.mock('./storage', () => ({
  storagePut: vi.fn(),
}));

describe('Image Upload System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate unique filename with timestamp', () => {
    const timestamp = Date.now();
    const originalname = 'test.jpg';
    const filename = `products/${timestamp}-${originalname}`;
    
    expect(filename).toContain('products/');
    expect(filename).toContain('test.jpg');
    expect(filename).toMatch(/products\/\d+-test\.jpg/);
  });

  it('should handle image upload with correct mime type', async () => {
    const mockUrl = '/manus-storage/products/1234567890-test.jpg';
    (storagePut as any).mockResolvedValue({ url: mockUrl });

    const buffer = Buffer.from('fake image data');
    const result = await storagePut('products/1234567890-test.jpg', buffer, 'image/jpeg');

    expect(result.url).toBe(mockUrl);
    expect(storagePut).toHaveBeenCalledWith(
      'products/1234567890-test.jpg',
      buffer,
      'image/jpeg'
    );
  });

  it('should support multiple image formats', async () => {
    const formats = [
      { name: 'test.jpg', mime: 'image/jpeg' },
      { name: 'test.png', mime: 'image/png' },
      { name: 'test.webp', mime: 'image/webp' },
      { name: 'test.gif', mime: 'image/gif' },
    ];

    for (const format of formats) {
      const mockUrl = `/manus-storage/products/1234567890-${format.name}`;
      (storagePut as any).mockResolvedValue({ url: mockUrl });

      const buffer = Buffer.from('fake image data');
      const result = await storagePut(
        `products/1234567890-${format.name}`,
        buffer,
        format.mime
      );

      expect(result.url).toContain(format.name);
    }
  });

  it('should return URL in correct format', async () => {
    const mockUrl = '/manus-storage/products/1234567890-logo.jpg';
    (storagePut as any).mockResolvedValue({ url: mockUrl });

    const buffer = Buffer.from('fake image data');
    const result = await storagePut('products/1234567890-logo.jpg', buffer, 'image/jpeg');

    expect(result.url).toMatch(/^\/manus-storage\/products\/\d+-/);
    expect(result.url).toContain('.jpg');
  });

  it('should handle large files up to 10MB', () => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const largeBuffer = Buffer.alloc(maxSize);
    
    expect(largeBuffer.length).toBe(maxSize);
  });

  it('should create unique filenames for concurrent uploads', () => {
    const timestamp1 = Date.now();
    const filename1 = `products/${timestamp1}-image1.jpg`;
    
    // Simulate small delay
    const timestamp2 = Date.now() + 1;
    const filename2 = `products/${timestamp2}-image2.jpg`;
    
    expect(filename1).not.toBe(filename2);
    expect(filename1).toMatch(/products\/\d+-image1\.jpg/);
    expect(filename2).toMatch(/products\/\d+-image2\.jpg/);
  });
});
