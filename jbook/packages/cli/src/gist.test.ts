import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchGistFiles, gistToCells, parseGistUrl } from './gist';

describe('parseGistUrl', () => {
  it('accepts the URL forms users copy', () => {
    expect(parseGistUrl('https://gist.github.com/danny/abc123def')).toBe(
      'abc123def'
    );
    expect(parseGistUrl('https://gist.github.com/abc123def')).toBe('abc123def');
    expect(
      parseGistUrl('https://gist.github.com/danny/abc123def#file-notes-md')
    ).toBe('abc123def');
    expect(parseGistUrl('http://gist.github.com/danny/abc123def/')).toBe(
      'abc123def'
    );
  });

  it('rejects non-gist inputs so they fall through to the file path', () => {
    expect(parseGistUrl('notebook.md')).toBeNull();
    expect(parseGistUrl('docs/notes.md')).toBeNull();
    expect(parseGistUrl('https://github.com/danny/repo')).toBeNull();
    expect(parseGistUrl('https://gist.github.com/danny/not hex!')).toBeNull();
  });
});

describe('gistToCells', () => {
  const NOTEBOOK = JSON.stringify([
    { id: '1', type: 'text', content: 'hi' },
    { id: '2', type: 'code', content: 'show(1);' },
  ]);
  const MARKDOWN = '# Title\n\n```js\nshow(2);\n```\n';

  it('an exported notebook wins over everything else', () => {
    const { filename, cells } = gistToCells([
      { filename: 'README.md', content: MARKDOWN },
      { filename: 'notebook.js', content: NOTEBOOK },
    ]);
    expect(filename).toBe('notebook.js');
    expect(cells).toHaveLength(2);
    expect(cells[1]).toMatchObject({ type: 'code', content: 'show(1);' });
  });

  it('a lone markdown file imports as markdown', () => {
    const { cells } = gistToCells([
      { filename: 'notes.md', content: MARKDOWN },
    ]);
    expect(cells[0]).toMatchObject({ type: 'text', content: '# Title' });
    expect(cells[1]).toMatchObject({ type: 'code', content: 'show(2);' });
  });

  it('several markdown files demand --file', () => {
    expect(() =>
      gistToCells([
        { filename: 'a.md', content: '# a' },
        { filename: 'b.md', content: '# b' },
      ])
    ).toThrow('--file');
  });

  it('a lone JS file becomes a single code cell', () => {
    const { filename, cells } = gistToCells([
      { filename: 'snippet.js', content: 'show(3);\n' },
    ]);
    expect(filename).toBe('snippet.js');
    expect(cells).toEqual([
      expect.objectContaining({ type: 'code', content: 'show(3);' }),
    ]);
  });

  it('several JS files get filename header cells', () => {
    const { cells } = gistToCells([
      { filename: 'a.ts', content: 'const a = 1;' },
      { filename: 'b.tsx', content: 'show(a);' },
    ]);
    expect(cells.map((c) => [c.type, c.content])).toEqual([
      ['text', '**a.ts**'],
      ['code', 'const a = 1;'],
      ['text', '**b.tsx**'],
      ['code', 'show(a);'],
    ]);
  });

  it('a plain .js file that is not a notebook still imports as code', () => {
    const { cells } = gistToCells([
      { filename: 'script.js', content: 'console.log(1);' },
    ]);
    expect(cells).toEqual([
      expect.objectContaining({ type: 'code', content: 'console.log(1);' }),
    ]);
  });

  it('--file forces a specific file and names the others when missing', () => {
    const files = [
      { filename: 'README.md', content: MARKDOWN },
      { filename: 'notebook.js', content: NOTEBOOK },
    ];
    const { filename, cells } = gistToCells(files, 'README.md');
    expect(filename).toBe('README.md');
    expect(cells[0]).toMatchObject({ type: 'text', content: '# Title' });

    expect(() => gistToCells(files, 'nope.md')).toThrow(
      'no file named nope.md (it has: README.md, notebook.js)'
    );
  });

  it('rejects a gist with nothing importable', () => {
    expect(() =>
      gistToCells([{ filename: 'data.csv', content: 'a,b' }])
    ).toThrow('nothing importable');
  });
});

describe('fetchGistFiles', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the files of a gist', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          files: {
            'a.md': {
              filename: 'a.md',
              content: '# a',
              truncated: false,
              raw_url: 'https://x/a.md',
            },
          },
        }),
      }))
    );

    expect(await fetchGistFiles('abc')).toEqual([
      { filename: 'a.md', content: '# a' },
    ]);
    expect(fetch).toHaveBeenCalledWith(
      'https://api.github.com/gists/abc',
      expect.anything()
    );
  });

  it('fetches the raw URL for truncated files', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        url.includes('api.github.com')
          ? {
              ok: true,
              status: 200,
              json: async () => ({
                files: {
                  'big.js': {
                    filename: 'big.js',
                    content: 'cut off',
                    truncated: true,
                    raw_url: 'https://raw/big.js',
                  },
                },
              }),
            }
          : { ok: true, status: 200, text: async () => 'the whole thing' }
      )
    );

    expect(await fetchGistFiles('abc')).toEqual([
      { filename: 'big.js', content: 'the whole thing' },
    ]);
  });

  it('says so when the gist does not exist', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 404 }))
    );
    await expect(fetchGistFiles('abc')).rejects.toThrow('no such gist');
  });

  it('surfaces other GitHub errors by status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 403 }))
    );
    await expect(fetchGistFiles('abc')).rejects.toThrow('GitHub answered 403');
  });
});
