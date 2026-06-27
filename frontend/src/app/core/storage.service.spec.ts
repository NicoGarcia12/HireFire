import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;
  let store: Record<string, string>;

  beforeEach(() => {
    store = {};
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => store[key] ?? null);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => { store[key] = value; });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation((key) => { delete store[key]; });

    service = new StorageService();
  });

  it('get() returns null when key does not exist', () => {
    expect(service.get('missing')).toBeNull();
  });

  it('set() + get() persists the value', () => {
    service.set('foo', 'bar');
    expect(service.get('foo')).toBe('bar');
  });

  it('set() overwrites an existing value', () => {
    service.set('foo', 'first');
    service.set('foo', 'second');
    expect(service.get('foo')).toBe('second');
  });

  it('remove() deletes the key', () => {
    service.set('foo', 'bar');
    service.remove('foo');
    expect(service.get('foo')).toBeNull();
  });

  it('remove() on non-existent key does not throw', () => {
    expect(() => service.remove('does-not-exist')).not.toThrow();
  });
});
