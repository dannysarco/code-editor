import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import path from 'path';
import fs from 'fs/promises';
import { importCommand } from './import';

vi.mock('fs/promises', () => ({
  default: {
    readFile: vi.fn(),
    writeFile: vi.fn(async () => {}),
    access: vi.fn(),
  },
}));

const MARKDOWN = '# Hello\n\n```jsx\nshow(1);\n```\n';

const program = importCommand.parent!;
// exitOverride is per-command and does not propagate to subcommands that
// already exist, so it goes on both.
program.exitOverride();
importCommand.exitOverride();
const run = (args: string[]) => program.parseAsync(args, { from: 'user' });

describe('import command parsing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fs.readFile).mockResolvedValue(MARKDOWN);
    // Default: the output notebook does not exist yet.
    vi.mocked(fs.access).mockRejectedValue(
      Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
    );
    vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`exit:${code}`);
    }) as never);
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('defaults to notebook.md and writes notebook.js beside it', async () => {
    await run(['import']);

    expect(fs.readFile).toHaveBeenCalledWith(
      path.resolve(process.cwd(), 'notebook.md'),
      'utf-8'
    );
    const [outPath, json] = vi.mocked(fs.writeFile).mock.calls[0];
    expect(outPath).toBe(path.resolve(process.cwd(), 'notebook.js'));
    const cells = JSON.parse(json as string);
    expect(cells).toHaveLength(2);
    expect(cells[0]).toMatchObject({ type: 'text', content: '# Hello' });
    expect(cells[1]).toMatchObject({ type: 'code', content: 'show(1);' });
  });

  it('derives the default output name from a named markdown file', async () => {
    await run(['import', 'docs/notes.md']);

    expect(vi.mocked(fs.writeFile).mock.calls[0][0]).toBe(
      path.resolve(process.cwd(), 'docs/notes.js')
    );
  });

  it('-o picks the output path and the success message points serve at it', async () => {
    await run(['import', 'notes.md', '-o', 'out/nb.js']);

    expect(vi.mocked(fs.writeFile).mock.calls[0][0]).toBe(
      path.resolve(process.cwd(), 'out/nb.js')
    );
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('my-scrapbook serve out/nb.js')
    );
  });

  it('refuses to overwrite the markdown file itself, before reading anything', async () => {
    await expect(
      run(['import', 'notes.md', '-o', 'notes.md'])
    ).rejects.toThrow('exit:1');

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('would overwrite the markdown file itself')
    );
    expect(fs.readFile).not.toHaveBeenCalled();
    expect(fs.writeFile).not.toHaveBeenCalled();
  });

  it('refuses to overwrite an existing notebook without -f', async () => {
    vi.mocked(fs.access).mockResolvedValue(undefined);

    await expect(run(['import'])).rejects.toThrow('exit:1');
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('notebook.js already exists')
    );
    expect(fs.writeFile).not.toHaveBeenCalled();
  });

  it('-f overwrites an existing notebook', async () => {
    vi.mocked(fs.access).mockResolvedValue(undefined);

    await run(['import', '-f']);

    expect(fs.writeFile).toHaveBeenCalledTimes(1);
  });

  it('reports a missing markdown file and exits 1', async () => {
    vi.mocked(fs.readFile).mockRejectedValueOnce(
      Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
    );

    await expect(run(['import', 'missing.md'])).rejects.toThrow('exit:1');
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('No markdown file found at missing.md')
    );
    expect(fs.writeFile).not.toHaveBeenCalled();
  });

  it('rejects excess arguments', async () => {
    await expect(run(['import', 'a.md', 'b.md'])).rejects.toMatchObject({
      code: 'commander.excessArguments',
    });
    expect(fs.readFile).not.toHaveBeenCalled();
  });
});
