import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { notifyIfOutdated } from './update-check';

const mockRegistry = (body: unknown, ok = true) =>
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok, json: async () => body }))
  );

describe('notifyIfOutdated', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('prints a notice when the registry has a newer version', async () => {
    mockRegistry({ version: '3.12.0' });
    await notifyIfOutdated('3.11.0');

    expect(logSpy).toHaveBeenCalledOnce();
    expect(logSpy.mock.calls[0][0]).toContain('3.12.0');
    expect(logSpy.mock.calls[0][0]).toContain('3.11.0');
  });

  it('compares numerically, not lexically', async () => {
    mockRegistry({ version: '3.11.0' });
    await notifyIfOutdated('3.9.0');

    expect(logSpy).toHaveBeenCalledOnce();
  });

  it('stays quiet when up to date', async () => {
    mockRegistry({ version: '3.11.0' });
    await notifyIfOutdated('3.11.0');

    expect(logSpy).not.toHaveBeenCalled();
  });

  it('stays quiet when local is ahead of the registry', async () => {
    mockRegistry({ version: '3.11.0' });
    await notifyIfOutdated('3.12.0');

    expect(logSpy).not.toHaveBeenCalled();
  });

  it('stays quiet on a non-ok response', async () => {
    mockRegistry({}, false);
    await notifyIfOutdated('3.11.0');

    expect(logSpy).not.toHaveBeenCalled();
  });

  it('stays quiet on malformed registry data', async () => {
    mockRegistry({ version: 'not-a-version' });
    await notifyIfOutdated('3.11.0');

    expect(logSpy).not.toHaveBeenCalled();
  });

  it('stays quiet when fetch rejects (offline)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down');
      })
    );

    await expect(notifyIfOutdated('3.11.0')).resolves.toBeUndefined();
    expect(logSpy).not.toHaveBeenCalled();
  });
});
