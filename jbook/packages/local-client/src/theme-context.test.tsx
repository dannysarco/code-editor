/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, useTheme, THEME_STORAGE_KEY } from './theme-context';

const Probe = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <button onClick={toggleTheme} data-testid="probe">
      {theme}
    </button>
  );
};

const renderProbe = () =>
  render(
    <ThemeProvider>
      <Probe />
    </ThemeProvider>
  );

const stubSystemDark = (matches: boolean) => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches }))
  );
};

describe('theme context', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  it('defaults to light when nothing is stored and the OS has no dark preference', () => {
    // jsdom has no matchMedia at all; the fallback must not crash.
    renderProbe();
    expect(screen.getByTestId('probe').textContent).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('follows the OS dark preference when nothing is stored', () => {
    stubSystemDark(true);
    renderProbe();
    expect(screen.getByTestId('probe').textContent).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('lets a stored choice beat the OS preference', () => {
    stubSystemDark(true);
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
    renderProbe();
    expect(screen.getByTestId('probe').textContent).toBe('light');
  });

  it('toggles, applies the attribute, and persists the choice', async () => {
    renderProbe();
    await userEvent.click(screen.getByTestId('probe'));

    expect(screen.getByTestId('probe').textContent).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    await userEvent.click(screen.getByTestId('probe'));
    expect(screen.getByTestId('probe').textContent).toBe('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('ignores junk in storage', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'zebra');
    renderProbe();
    expect(screen.getByTestId('probe').textContent).toBe('light');
  });
});
