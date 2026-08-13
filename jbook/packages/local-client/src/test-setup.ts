import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Testing Library only auto-registers its cleanup when a global afterEach
// exists (vitest globals are off here), so register it explicitly.
afterEach(cleanup);

// jsdom has no matchMedia; components render the desktop layout in tests.
// (Guarded: some suites run in the node environment, where window is absent.)
if (typeof window !== 'undefined') {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      onchange: null,
      dispatchEvent: () => false,
    } as MediaQueryList);
}
