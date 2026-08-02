/** @vitest-environment jsdom */
import { describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import Preview from './preview';
import { MAX_CONSOLE_ENTRIES } from '../constants';

// Delivers a message event the way the iframe document would: same shape,
// with event.source set to the sending window.
const postIframeMessage = (source: Window | null, data: unknown) => {
  act(() => {
    window.dispatchEvent(new MessageEvent('message', { data, source }));
  });
};

const postConsoleMessage = (
  source: Window | null,
  level: string,
  text: string
) => {
  postIframeMessage(source, { source: 'preview-console', level, text });
};

describe('Preview', () => {
  it('renders a sandboxed iframe whose document handles runtime errors', () => {
    render(<Preview code="console.log(1);" err="" />);

    const iframe = screen.getByTitle('preview') as HTMLIFrameElement;
    expect(iframe).toHaveAttribute('sandbox', 'allow-scripts');
    expect(iframe.getAttribute('srcdoc')).toContain('Runtime Error');
    expect(iframe.getAttribute('srcdoc')).toContain("addEventListener('message'");
    expect(iframe.getAttribute('srcdoc')).toContain('preview-ready');
  });

  it('posts the bundled code only once the iframe document reports ready', () => {
    const { container } = render(<Preview code="show(42);" err="" />);
    const iframe = container.querySelector('iframe') as HTMLIFrameElement;
    const postMessage = vi.fn();
    const contentWindow = { postMessage } as unknown as Window;
    Object.defineProperty(iframe, 'contentWindow', { value: contentWindow });

    expect(postMessage).not.toHaveBeenCalled();

    postIframeMessage(contentWindow, { source: 'preview-ready' });
    expect(postMessage).toHaveBeenCalledWith('show(42);', '*');

    // A second ready from the same document must not re-execute stale code.
    postIframeMessage(contentWindow, { source: 'preview-ready' });
    expect(postMessage).toHaveBeenCalledTimes(1);
  });

  it("ignores ready signals from other previews' iframes", () => {
    const { container } = render(<Preview code="show(42);" err="" />);
    const iframe = container.querySelector('iframe') as HTMLIFrameElement;
    const postMessage = vi.fn();
    Object.defineProperty(iframe, 'contentWindow', {
      value: { postMessage },
    });

    postIframeMessage(null, { source: 'preview-ready' });
    expect(postMessage).not.toHaveBeenCalled();
  });

  it('shows bundling errors over the preview', () => {
    render(<Preview code="" err="Cannot resolve module" />);
    expect(screen.getByText('Cannot resolve module')).toBeInTheDocument();
  });

  it('patches the iframe console to forward log entries', () => {
    render(<Preview code="" err="" />);
    const srcdoc = (
      screen.getByTitle('preview') as HTMLIFrameElement
    ).getAttribute('srcdoc');
    expect(srcdoc).toContain("'preview-console'");
    expect(srcdoc).toContain("['log', 'info', 'warn', 'error', 'debug']");
  });

  it('renders forwarded console entries with their level', () => {
    const { container } = render(<Preview code="" err="" />);
    const iframe = container.querySelector('iframe') as HTMLIFrameElement;

    expect(container.querySelector('.preview-console')).toBeNull();

    postConsoleMessage(iframe.contentWindow, 'log', 'hello world');
    postConsoleMessage(iframe.contentWindow, 'error', 'boom');

    expect(screen.getByText('hello world')).toHaveClass('preview-console-log');
    expect(screen.getByText('boom')).toHaveClass('preview-console-error');
    expect(screen.getByText('Console (2)')).toBeInTheDocument();
  });

  it("ignores messages that aren't from its own iframe", () => {
    const { container } = render(<Preview code="" err="" />);
    const iframe = container.querySelector('iframe') as HTMLIFrameElement;

    postConsoleMessage(null, 'log', 'someone elses log');
    postConsoleMessage(iframe.contentWindow, 'log', 'mine');

    expect(screen.queryByText('someone elses log')).toBeNull();
    expect(screen.getByText('mine')).toBeInTheDocument();
  });

  it('caps stored entries and says the oldest were dropped', () => {
    const { container } = render(<Preview code="" err="" />);
    const iframe = container.querySelector('iframe') as HTMLIFrameElement;

    for (let i = 0; i < MAX_CONSOLE_ENTRIES + 5; i++) {
      postConsoleMessage(iframe.contentWindow, 'log', `entry ${i}`);
    }

    expect(container.querySelectorAll('.preview-console-entry')).toHaveLength(
      MAX_CONSOLE_ENTRIES
    );
    expect(screen.queryByText('entry 0')).toBeNull();
    expect(
      screen.getByText(`Console (${MAX_CONSOLE_ENTRIES}, oldest dropped)`)
    ).toBeInTheDocument();
  });

  it('clears entries via the button and on a new run', () => {
    const { container, rerender } = render(<Preview code="a" err="" />);
    const iframe = container.querySelector('iframe') as HTMLIFrameElement;

    postConsoleMessage(iframe.contentWindow, 'log', 'first');
    act(() => {
      screen.getByText('Clear').click();
    });
    expect(container.querySelector('.preview-console')).toBeNull();

    postConsoleMessage(iframe.contentWindow, 'log', 'second');
    expect(screen.getByText('second')).toBeInTheDocument();

    rerender(<Preview code="b" err="" />);
    expect(container.querySelector('.preview-console')).toBeNull();
  });
});
