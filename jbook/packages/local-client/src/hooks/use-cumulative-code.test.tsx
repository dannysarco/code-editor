/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { ReactNode } from 'react';
import { useCumulativeCode } from './use-cumulative-code';
import { makeStore } from '../test-utils';
import { Cell } from '../state/cell';

const cells: Cell[] = [
  { id: 'code-a', type: 'code', content: 'const a = 1;' },
  { id: 'text-1', type: 'text', content: '# docs in between' },
  { id: 'code-b', type: 'code', content: 'show(a);' },
  { id: 'code-c', type: 'code', content: 'show("later");' },
];

const renderFor = (cellId: string) => {
  const store = makeStore(cells);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  return renderHook(() => useCumulativeCode(cellId), { wrapper }).result
    .current;
};

describe('useCumulativeCode', () => {
  it('joins all earlier code cells before the target cell', () => {
    const code = renderFor('code-b');
    expect(code).toContain('const a = 1;');
    expect(code).toContain('show(a);');
  });

  it('stops at the target cell and skips text cells', () => {
    const code = renderFor('code-b');
    expect(code).not.toContain('show("later");');
    expect(code).not.toContain('# docs in between');
  });

  it('gives only the target cell a live show function', () => {
    const code = renderFor('code-b');
    // earlier cells get the no-op, the target gets the real implementation
    expect(code.match(/var show = \(\) => \{\}/g)).toHaveLength(1);
    expect(code.match(/\.createRoot\(/g)).toHaveLength(1);
    // the live show must come after the no-op so it wins for the target cell
    expect(code.indexOf('.createRoot(')).toBeGreaterThan(
      code.indexOf('var show = () => {}')
    );
  });

  it('includes every earlier cell for the last cell', () => {
    const code = renderFor('code-c');
    expect(code).toContain('const a = 1;');
    expect(code).toContain('show(a);');
    expect(code).toContain('show("later");');
    expect(code.match(/var show = \(\) => \{\}/g)).toHaveLength(2);
  });
});
