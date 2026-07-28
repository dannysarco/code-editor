/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OfflineStatus from './offline-status';
import { clearModuleCache } from '../bundler/module-cache';

vi.mock('../bundler/module-cache', () => ({
  clearModuleCache: vi.fn(),
}));

describe('OfflineStatus', () => {
  beforeEach(() => {
    vi.mocked(clearModuleCache).mockReset().mockResolvedValue(4);
  });

  it('shows no offline badge while online', () => {
    render(<OfflineStatus />);
    expect(screen.queryByText(/offline/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /clear module cache/i })
    ).toBeInTheDocument();
  });

  it('shows the offline badge when the connection drops and hides it on return', () => {
    render(<OfflineStatus />);

    fireEvent(window, new Event('offline'));
    expect(
      screen.getByText(/offline — cached packages still work/i)
    ).toBeInTheDocument();

    fireEvent(window, new Event('online'));
    expect(screen.queryByText(/offline/i)).not.toBeInTheDocument();
  });

  it('clears the module cache and reports the count', async () => {
    const user = userEvent.setup();
    render(<OfflineStatus />);

    await user.click(
      screen.getByRole('button', { name: /clear module cache/i })
    );

    expect(clearModuleCache).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByText('Cleared 4 cached modules')
    ).toBeInTheDocument();
  });

  it('uses singular wording for a single cleared module', async () => {
    vi.mocked(clearModuleCache).mockResolvedValue(1);
    const user = userEvent.setup();
    render(<OfflineStatus />);

    await user.click(
      screen.getByRole('button', { name: /clear module cache/i })
    );

    expect(
      await screen.findByText('Cleared 1 cached module')
    ).toBeInTheDocument();
  });
});
