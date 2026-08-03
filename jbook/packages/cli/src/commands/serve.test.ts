import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import path from 'path';
import { serveCommand } from './serve';
import { serve } from '@my-scrapbook/local-api';
import { openBrowser } from '../open-browser';

vi.mock('@my-scrapbook/local-api', () => ({
  serve: vi.fn(async () => {}),
}));
vi.mock('../open-browser', () => ({
  openBrowser: vi.fn(),
}));

// serveCommand is a subcommand; parsing goes through its (anonymous) parent.
// exitOverride makes commander's own errors (unknown option, excess
// arguments) throw instead of exiting the process.
const program = serveCommand.parent!;
// exitOverride is per-command and does not propagate to subcommands that
// already exist, so it goes on both.
program.exitOverride();
serveCommand.exitOverride();
const run = (args: string[]) => program.parseAsync(args, { from: 'user' });

describe('serve command parsing', () => {
  let exitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    // The action calls process.exit(1) on failure; turn that into a throw so
    // the test can observe it (and nothing actually exits).
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`exit:${code}`);
    }) as never);
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('defaults to notebook.js on port 4005 and opens the browser', async () => {
    await run(['serve']);

    expect(serve).toHaveBeenCalledWith(
      4005,
      'notebook.js',
      process.cwd(),
      true
    );
    expect(openBrowser).toHaveBeenCalledWith('http://localhost:4005');
  });

  it('parses a nested filename and a custom port', async () => {
    await run(['serve', 'docs/notes.js', '-p', '4100']);

    expect(serve).toHaveBeenCalledWith(
      4100,
      'notes.js',
      path.join(process.cwd(), 'docs'),
      true
    );
    expect(openBrowser).toHaveBeenCalledWith('http://localhost:4100');
  });

  it('--no-open starts the server without launching a browser', async () => {
    await run(['serve', '--no-open']);

    expect(serve).toHaveBeenCalled();
    expect(openBrowser).not.toHaveBeenCalled();
  });

  it('explains an in-use port and exits 1', async () => {
    const err = Object.assign(new Error('listen EADDRINUSE'), {
      code: 'EADDRINUSE',
    });
    vi.mocked(serve).mockRejectedValueOnce(err);

    await expect(run(['serve', 'notes.js', '-p', '4005'])).rejects.toThrow(
      'exit:1'
    );
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Port 4005 is already in use')
    );
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('my-scrapbook serve notes.js -p <port>')
    );
    expect(openBrowser).not.toHaveBeenCalled();
  });

  it('reports other startup failures with file and port context', async () => {
    vi.mocked(serve).mockRejectedValueOnce(new Error('EACCES boom'));

    await expect(run(['serve'])).rejects.toThrow('exit:1');
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to open notebook.js on port 4005')
    );
  });

  it('rejects excess arguments instead of silently ignoring them', async () => {
    await expect(run(['serve', 'a.js', 'b.js'])).rejects.toMatchObject({
      code: 'commander.excessArguments',
    });
    expect(serve).not.toHaveBeenCalled();
  });
});
