import { beforeEach, describe, expect, it, vi } from 'vitest';

const esbuildMock = vi.hoisted(() => ({
  version: '0.99.0',
  initialize: vi.fn(),
  build: vi.fn(),
}));

const cache = vi.hoisted(() => ({
  getItem: vi.fn(),
  setItem: vi.fn(),
}));

vi.mock('esbuild-wasm', () => esbuildMock);
vi.mock('esbuild-wasm/esbuild.wasm?url', () => ({
  default: '/assets/esbuild.wasm',
}));
vi.mock('localforage', () => ({
  default: {
    createInstance: () => cache,
  },
}));

// bundle() caches initialization in module state, so each test gets a fresh
// copy of the module.
const loadBundle = async () => {
  vi.resetModules();
  return (await import('./index')).default;
};

describe('bundler initialization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    esbuildMock.build.mockResolvedValue({ outputFiles: [{ text: 'bundled' }] });
  });

  it('initializes from the locally bundled wasm binary', async () => {
    esbuildMock.initialize.mockResolvedValue(undefined);
    const bundle = await loadBundle();

    const result = await bundle('const a = 1;');

    expect(result).toEqual({ code: 'bundled', err: '' });
    expect(esbuildMock.initialize).toHaveBeenCalledTimes(1);
    expect(esbuildMock.initialize).toHaveBeenCalledWith({
      wasmURL: '/assets/esbuild.wasm',
      worker: true,
    });
  });

  it('initializes only once across bundles', async () => {
    esbuildMock.initialize.mockResolvedValue(undefined);
    const bundle = await loadBundle();

    await bundle('1');
    await bundle('2');

    expect(esbuildMock.initialize).toHaveBeenCalledTimes(1);
  });

  it('falls back to unpkg, pinned to the installed version, if the local wasm fails', async () => {
    esbuildMock.initialize
      .mockRejectedValueOnce(new Error('failed to fetch wasm'))
      .mockResolvedValueOnce(undefined);
    const bundle = await loadBundle();

    const result = await bundle('const a = 1;');

    expect(result).toEqual({ code: 'bundled', err: '' });
    expect(esbuildMock.initialize).toHaveBeenCalledTimes(2);
    expect(esbuildMock.initialize).toHaveBeenLastCalledWith({
      wasmURL: 'https://unpkg.com/esbuild-wasm@0.99.0/esbuild.wasm',
      worker: true,
    });
  });

  it('reports the error and allows a retry when both sources fail', async () => {
    esbuildMock.initialize
      .mockRejectedValueOnce(new Error('local failed'))
      .mockRejectedValueOnce(new Error('unpkg failed'))
      .mockResolvedValueOnce(undefined);
    const bundle = await loadBundle();

    const failed = await bundle('const a = 1;');
    expect(failed.code).toBe('');
    expect(failed.err).toBe('unpkg failed');

    // The failed initialization is not cached: the next bundle retries.
    const retried = await bundle('const a = 1;');
    expect(retried).toEqual({ code: 'bundled', err: '' });
  });
});
