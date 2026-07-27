import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Testing Library only auto-registers its cleanup when a global afterEach
// exists (vitest globals are off here), so register it explicitly.
afterEach(cleanup);
