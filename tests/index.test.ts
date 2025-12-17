import { describe, it, expect } from 'vitest';
import { getProvider, getRateLimitProvider } from '../src';

describe('index exports', () => {
  it('re-exports provider factories', () => {
    expect(typeof getProvider).toBe('function');
    expect(typeof getRateLimitProvider).toBe('function');
  });
});
