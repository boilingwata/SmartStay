import { describe, it, expect } from 'vitest';
import { getNormalizedHttpUrl, TRUSTED_DOMAINS } from './security';

describe('getNormalizedHttpUrl', () => {
  it('should return null for invalid inputs', () => {
    expect(getNormalizedHttpUrl(null)).toBeNull();
    expect(getNormalizedHttpUrl(undefined)).toBeNull();
    expect(getNormalizedHttpUrl('')).toBeNull();
    expect(getNormalizedHttpUrl('   ')).toBeNull();
    expect(getNormalizedHttpUrl(123)).toBeNull();
  });

  it('should export TRUSTED_DOMAINS array', () => {
    expect(Array.isArray(TRUSTED_DOMAINS)).toBe(true);
    expect(TRUSTED_DOMAINS.length).toBeGreaterThan(0);
  });

  it('should return null for untrusted domains', () => {
    expect(getNormalizedHttpUrl('https://evil-domain.com')).toBeNull();
    expect(getNormalizedHttpUrl('http://192.168.1.1/admin')).toBeNull();
  });

  it('should return null for unsafe protocols even on trusted domains', () => {
    expect(getNormalizedHttpUrl('javascript:alert(1)')).toBeNull();
    expect(getNormalizedHttpUrl('data:text/html,<html>')).toBeNull();
    // Protocol spoofing or weird protocols
    expect(getNormalizedHttpUrl('file:///etc/passwd')).toBeNull();
    expect(getNormalizedHttpUrl('ftp://cdn.smartstay.vn/file')).toBeNull();
  });

  it('should accept exact trusted domains', () => {
    expect(getNormalizedHttpUrl('https://cdn.smartstay.vn/image.png')).toBe('https://cdn.smartstay.vn/image.png');
    expect(getNormalizedHttpUrl('http://localhost:3000')).toBe('http://localhost:3000/');
  });

  it('should accept subdomains of trusted domains', () => {
    expect(getNormalizedHttpUrl('https://assets.cdn.smartstay.vn/video.mp4')).toBe('https://assets.cdn.smartstay.vn/video.mp4');
  });

  it('should strip out embedded credentials', () => {
    const maliciousUrl = 'https://admin:password123@cdn.smartstay.vn/secret';
    // The username/password must be aggressively scrubbed before stringification
    expect(getNormalizedHttpUrl(maliciousUrl)).toBe('https://cdn.smartstay.vn/secret');
  });

  it('should safely handle ports', () => {
    expect(getNormalizedHttpUrl('http://localhost:8080/test')).toBe('http://localhost:8080/test');
    expect(getNormalizedHttpUrl('http://localhost:80/test')).toBe('http://localhost/test');
    expect(getNormalizedHttpUrl('https://cdn.smartstay.vn:443/test')).toBe('https://cdn.smartstay.vn/test');
  });

  it('should handle IP literals properly matched', () => {
    expect(getNormalizedHttpUrl('http://127.0.0.1:5173')).toBe('http://127.0.0.1:5173/');
    expect(getNormalizedHttpUrl('http://127.0.0.1.bad.com')).toBeNull();
  });
});
