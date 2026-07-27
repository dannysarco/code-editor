/** @vitest-environment jsdom */
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import ErrorBoundary from './error-boundary';

const Bomb = ({ defused }: { defused?: boolean }) => {
  if (!defused) {
    throw new Error('kaboom');
  }
  return <div>all good</div>;
};

describe('ErrorBoundary', () => {
  it('renders children when nothing throws', () => {
    render(
      <ErrorBoundary>
        <div>healthy content</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('healthy content')).toBeInTheDocument();
  });

  it('shows the fallback with the error message when a child throws', () => {
    // React logs caught errors; keep test output quiet.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );
    spy.mockRestore();

    expect(
      screen.getByText('Something went wrong in this cell')
    ).toBeInTheDocument();
    expect(screen.getByText('kaboom')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();
  });

  it('recovers via the Reset button once the child stops throwing', async () => {
    const user = userEvent.setup();

    const Harness = () => {
      const [defused, setDefused] = useState(false);
      return (
        <div>
          <button onClick={() => setDefused(true)}>defuse</button>
          <ErrorBoundary>
            <Bomb defused={defused} />
          </ErrorBoundary>
        </div>
      );
    };

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<Harness />);
    expect(screen.getByText('kaboom')).toBeInTheDocument();

    await user.click(screen.getByText('defuse'));
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    spy.mockRestore();

    expect(screen.getByText('all good')).toBeInTheDocument();
    expect(screen.queryByText('kaboom')).not.toBeInTheDocument();
  });

  it('logs caught errors with their component stack', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );
    const logged = spy.mock.calls.some((args) => args[0] === 'Cell crashed:');
    spy.mockRestore();
    expect(logged).toBe(true);
  });
});
