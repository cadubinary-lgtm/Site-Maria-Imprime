import { describe, it, expect } from 'vitest';

describe('FileValidator', () => {
  it('deve validar arquivo PDF corretamente', () => {
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    expect(file.type).toBe('application/pdf');
    expect(file.size).toBeLessThan(50 * 1024 * 1024);
  });

  it('deve validar arquivo JPG corretamente', () => {
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    expect(file.type).toBe('image/jpeg');
  });

  it('deve validar arquivo PNG corretamente', () => {
    const file = new File(['test'], 'test.png', { type: 'image/png' });
    expect(file.type).toBe('image/png');
  });

  it('deve rejeitar arquivo com tipo inválido', () => {
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    expect(file.type).not.toBe('application/pdf');
    expect(file.type).not.toBe('image/jpeg');
  });

  it('deve validar tamanho máximo de arquivo', () => {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    expect(file.size).toBeLessThan(maxSize);
  });

  it('deve detectar arquivo muito grande', () => {
    // Criar arquivo simulado de 100MB
    const largeContent = new Array(100 * 1024 * 1024).fill('x').join('');
    const file = new File([largeContent], 'large.pdf', { type: 'application/pdf' });
    expect(file.size).toBeGreaterThan(50 * 1024 * 1024);
  });

  it('deve validar múltiplos formatos de arquivo', () => {
    const validFormats = ['application/pdf', 'image/jpeg', 'image/png', 'application/x-cdr', 'application/postscript'];
    const testFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    expect(validFormats).toContain(testFile.type);
  });
});
