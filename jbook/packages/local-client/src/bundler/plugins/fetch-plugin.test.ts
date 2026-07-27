import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';

// vi.mock factories are hoisted above ordinary declarations, so the shared
// cache object must be hoisted too.
const cache = vi.hoisted(() => ({
  getItem: vi.fn(),
  setItem: vi.fn(),
}));

vi.mock('axios');
vi.mock('localforage', () => ({
  default: {
    createInstance: () => cache,
  },
}));

import { fetchPlugin } from './fetch-plugin';

type Handler = { filter: RegExp; cb: (args: any) => any };

// Stand-in for esbuild's onLoad dispatch: handlers are tried in registration
// order and the first non-undefined result wins.
const makeLoader = (inputCode: string) => {
  const handlers: Handler[] = [];
  fetchPlugin(inputCode).setup({
    onLoad: (opts: { filter: RegExp }, cb: Handler['cb']) => {
      handlers.push({ filter: opts.filter, cb });
    },
  } as any);

  return async (args: { path: string }) => {
    for (const handler of handlers) {
      if (!handler.filter.test(args.path)) continue;
      const result = await handler.cb(args);
      if (result !== undefined) return result;
    }
    return undefined;
  };
};

describe('fetch plugin', () => {
  beforeEach(() => {
    cache.getItem.mockReset().mockResolvedValue(null);
    cache.setItem.mockReset().mockResolvedValue(undefined);
    vi.mocked(axios.get).mockReset();
  });

  it('serves the entry point from the raw cell code', async () => {
    const load = makeLoader('show(42);');
    expect(await load({ path: 'index.js' })).toEqual({
      loader: 'jsx',
      contents: 'show(42);',
    });
  });

  it('returns cached results without fetching', async () => {
    const cached = { loader: 'jsx', contents: 'cached!' };
    cache.getItem.mockResolvedValue(cached);
    const load = makeLoader('');

    expect(await load({ path: 'https://unpkg.com/react' })).toEqual(cached);
    expect(axios.get).not.toHaveBeenCalled();
  });

  it('fetches and caches JavaScript modules', async () => {
    vi.mocked(axios.get).mockResolvedValue({
      data: 'module.exports = 1;',
      request: { responseURL: 'https://unpkg.com/pkg@1.0.0/index.js' },
    });
    const load = makeLoader('');

    const result = await load({ path: 'https://unpkg.com/pkg' });

    expect(result).toEqual({
      loader: 'jsx',
      contents: 'module.exports = 1;',
      resolveDir: '/pkg@1.0.0/',
    });
    expect(cache.setItem).toHaveBeenCalledWith(
      'https://unpkg.com/pkg',
      result
    );
  });

  it('wraps CSS in a style-injecting script with escaped content', async () => {
    vi.mocked(axios.get).mockResolvedValue({
      data: '.button {\n  color: "red";\n}',
      request: {
        responseURL: 'https://unpkg.com/bulma@1.0.0/css/bulma.css',
      },
    });
    const load = makeLoader('');

    const result = await load({
      path: 'https://unpkg.com/bulma/css/bulma.css',
    });

    expect(result.loader).toBe('jsx');
    expect(result.resolveDir).toBe('/bulma@1.0.0/css/');
    expect(result.contents).toContain("document.createElement('style')");
    expect(result.contents).toContain('document.head.appendChild');
    // newlines removed, quotes escaped so the CSS survives as a JS string
    expect(result.contents).not.toContain('\n  color');
    expect(result.contents).toContain('\\"red\\"');
  });
});
