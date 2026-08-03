/** @vitest-environment jsdom */
import { describe, expect, it, vi } from 'vitest';
import { renderMarkdownToHtml } from './render-markdown';

// The markdown library is exercised in the browser; this tests the capture
// mechanics (render, read innerHTML, unmount) against a minimal stand-in.
vi.mock('@uiw/react-md-editor', () => {
  const MDEditor = () => null;
  MDEditor.Markdown = ({ source }: { source?: string }) => (
    <article className="rendered">{source}</article>
  );
  return { default: MDEditor };
});

describe('renderMarkdownToHtml', () => {
  it('returns the markup the notebook renderer produces', () => {
    expect(renderMarkdownToHtml('# Hi')).toBe(
      '<article class="rendered"># Hi</article>'
    );
  });

  it('leaves nothing mounted behind', () => {
    renderMarkdownToHtml('text');
    expect(document.body.innerHTML).toBe('');
  });
});
