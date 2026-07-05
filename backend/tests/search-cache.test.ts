import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCached, searchCacheKey, setCached } from '../src/utils/search-cache.js';

describe('search-cache', () => {
  it('returns null for a key that was never set', () => {
    const key = searchCacheKey({ keywords: 'never-set', location: '', remote: false, limit: 30 });
    assert.equal(getCached(key), null);
  });

  it('returns the cached value for a key that was set', () => {
    const key = searchCacheKey({ keywords: 'backend developer', location: '', remote: false, limit: 30 });
    setCached(key, [{ id: 'job-1' }]);
    assert.deepEqual(getCached(key), [{ id: 'job-1' }]);
  });

  it('produces the same key regardless of property order', () => {
    const keyA = searchCacheKey({ keywords: 'dev', location: 'CABA', remote: true, limit: 10 });
    const keyB = searchCacheKey({ limit: 10, remote: true, location: 'CABA', keywords: 'dev' });
    assert.equal(keyA, keyB);
  });

  it('produces different keys for different params', () => {
    const keyA = searchCacheKey({ keywords: 'dev', location: '', remote: false, limit: 30 });
    const keyB = searchCacheKey({ keywords: 'dev', location: '', remote: true, limit: 30 });
    assert.notEqual(keyA, keyB);
  });
});
