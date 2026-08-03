import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import path from 'path';
import fs from 'fs/promises';
import { exportCommand } from './export';

vi.mock('fs/promises', () => ({
  default: {
    readFile: vi.fn(),
    writeFile: vi.fn(async () => {}),
  },
}));

const NOTEBOOK_JSON = JSON.stringify([
  { id: 't1', type: 'text', content: '# Hello' },
  { id: 'c1', type: 'code', content: 'show(1)' },
]);

const program = exportCommand.parent!;
// exitOverride is per-command and does not propagate to subcommands that
// already exist, so it goes on both.
program.exitOverride();
exportCommand.exitOverride();
const run = (args: string[]) => program.parseAsync(args, { from: 'user' });

describe('export command parsing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fs.readFile).mockResolvedValue(NOTEBOOK_JSON);
    vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`exit:${code}`);
    }) as never);
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('defaults to notebook.js and writes notebook.md beside it', async () => {
    await run(['export']);

    expect(fs.readFile).toHaveBeenCalledWith(
      path.resolve(process.cwd(), 'notebook.js'),
      'utf-8'
    );
    const [outPath, markdown] = vi.mocked(fs.writeFile).mock.calls[0];
    expect(outPath).toBe(path.resolve(process.cwd(), 'notebook.md'));
    expect(markdown).toContain('# Hello');
    expect(markdown).toContain('show(1)');
  });

  it('derives the default output name from a named notebook', async () => {
    await run(['export', 'docs/notes.js']);

    expect(vi.mocked(fs.writeFile).mock.calls[0][0]).toBe(
      path.resolve(process.cwd(), 'docs/notes.md')
    );
  });

  it('-o picks the output path', async () => {
    await run(['export', 'notes.js', '-o', 'out/readme.md']);

    expect(vi.mocked(fs.writeFile).mock.calls[0][0]).toBe(
      path.resolve(process.cwd(), 'out/readme.md')
    );
  });

  it('refuses to overwrite the notebook itself, before reading anything', async () => {
    await expect(
      run(['export', 'notebook.js', '-o', 'notebook.js'])
    ).rejects.toThrow('exit:1');

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('would overwrite the notebook itself')
    );
    expect(fs.readFile).not.toHaveBeenCalled();
    expect(fs.writeFile).not.toHaveBeenCalled();
  });

  it('points at serve when the notebook does not exist', async () => {
    vi.mocked(fs.readFile).mockRejectedValueOnce(
      Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
    );

    await expect(run(['export', 'missing.js'])).rejects.toThrow('exit:1');
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('No notebook found at missing.js')
    );
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('my-scrapbook serve missing.js')
    );
  });

  it('reports an unparseable notebook and exits 1', async () => {
    vi.mocked(fs.readFile).mockResolvedValueOnce('not json at all');

    await expect(run(['export'])).rejects.toThrow('exit:1');
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Could not export notebook.js')
    );
    expect(fs.writeFile).not.toHaveBeenCalled();
  });

  it('rejects excess arguments', async () => {
    await expect(run(['export', 'a.js', 'b.js'])).rejects.toMatchObject({
      code: 'commander.excessArguments',
    });
    expect(fs.readFile).not.toHaveBeenCalled();
  });
});
