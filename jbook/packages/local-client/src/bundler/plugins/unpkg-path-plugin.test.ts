import { describe, expect, it } from 'vitest';
import { unpkgPathPlugin } from './unpkg-path-plugin';

type OnResolveArgs = { path: string; resolveDir?: string };
type Handler = {
  filter: RegExp;
  cb: (args: OnResolveArgs) => any;
};

// Minimal stand-in for esbuild's plugin host: collect onResolve handlers and
// dispatch to the first one whose filter matches, like esbuild does.
const makeResolver = () => {
  const handlers: Handler[] = [];
  unpkgPathPlugin().setup({
    onResolve: (opts: { filter: RegExp }, cb: Handler['cb']) => {
      handlers.push({ filter: opts.filter, cb });
    },
    onLoad: () => {},
  } as any);

  return (args: OnResolveArgs) => {
    const handler = handlers.find((h) => h.filter.test(args.path));
    if (!handler) throw new Error(`no handler for ${args.path}`);
    return handler.cb(args);
  };
};

describe('unpkg path plugin', () => {
  it('resolves the entry point to the virtual namespace', () => {
    const resolve = makeResolver();
    expect(resolve({ path: 'index.js' })).toEqual({
      path: 'index.js',
      namespace: 'a',
    });
  });

  it('resolves bare module names to unpkg', async () => {
    const resolve = makeResolver();
    expect(await resolve({ path: 'react' })).toEqual({
      namespace: 'a',
      path: 'https://unpkg.com/react',
    });
    expect(await resolve({ path: 'bulma/css/bulma.css' })).toEqual({
      namespace: 'a',
      path: 'https://unpkg.com/bulma/css/bulma.css',
    });
  });

  it('passes version-pinned specifiers through to unpkg', async () => {
    // unpkg resolves the semver range server-side, so the URL carries the
    // pin verbatim: unpkg.com/lodash@4 answers with lodash@4.x's code.
    const resolve = makeResolver();
    expect(await resolve({ path: 'lodash@4' })).toEqual({
      namespace: 'a',
      path: 'https://unpkg.com/lodash@4',
    });
    expect(await resolve({ path: 'axios@0.27.2' })).toEqual({
      namespace: 'a',
      path: 'https://unpkg.com/axios@0.27.2',
    });
    expect(await resolve({ path: '@tanstack/react-query@5' })).toEqual({
      namespace: 'a',
      path: 'https://unpkg.com/@tanstack/react-query@5',
    });
    expect(await resolve({ path: 'bulma@0.9/css/bulma.css' })).toEqual({
      namespace: 'a',
      path: 'https://unpkg.com/bulma@0.9/css/bulma.css',
    });
  });

  it('resolves relative paths against the importing module directory', () => {
    const resolve = makeResolver();
    expect(
      resolve({ path: './cjs/react.production.js', resolveDir: '/react@19.0.0' })
    ).toEqual({
      namespace: 'a',
      path: 'https://unpkg.com/react@19.0.0/cjs/react.production.js',
    });
  });

  it('resolves parent-relative paths', () => {
    const resolve = makeResolver();
    expect(
      resolve({ path: '../shared/utils.js', resolveDir: '/pkg@1.0.0/lib' })
    ).toEqual({
      namespace: 'a',
      path: 'https://unpkg.com/pkg@1.0.0/shared/utils.js',
    });
  });
});
