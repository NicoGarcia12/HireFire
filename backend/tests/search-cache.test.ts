import { describe, expect, it } from 'vitest';
import { getCached, searchCacheKey, setCached } from '../src/utils/search-cache.js';

describe('search-cache', () => {
  it('returns null for a key that was never set', () => {
    const key = searchCacheKey({ keywords: 'never-set', location: '', remote: false, limit: 30 });
    expect(getCached(key)).toBe(null);
  });

  it('returns the cached value for a key that was set', () => {
    const key = searchCacheKey({
      keywords: 'backend developer',
      location: '',
      remote: false,
      limit: 30,
    });
    setCached(key, [{ id: 'job-1' }]);
    expect(getCached(key)).toEqual([{ id: 'job-1' }]);
  });

  it('produces the same key regardless of property order', () => {
    const keyA = searchCacheKey({ keywords: 'dev', location: 'CABA', remote: true, limit: 10 });
    const keyB = searchCacheKey({ limit: 10, remote: true, location: 'CABA', keywords: 'dev' });
    expect(keyA).toBe(keyB);
  });

  it('produces different keys for different params', () => {
    const keyA = searchCacheKey({ keywords: 'dev', location: '', remote: false, limit: 30 });
    const keyB = searchCacheKey({ keywords: 'dev', location: '', remote: true, limit: 30 });
    expect(keyA).not.toBe(keyB);
  });
});
