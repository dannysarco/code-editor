import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import MDEditor from '@uiw/react-md-editor';

// Renders a text cell's markdown with the same component the notebook
// displays it with, then captures the resulting HTML — so the export matches
// what the user sees without shipping a second markdown pipeline.
export const renderMarkdownToHtml = (source: string): string => {
  const host = document.createElement('div');
  const root = createRoot(host);
  // flushSync forces the render to commit before we read innerHTML; React 18
  // batches renders asynchronously otherwise.
  flushSync(() => {
    root.render(<MDEditor.Markdown source={source} />);
  });
  const html = host.innerHTML;
  root.unmount();
  return html;
};
