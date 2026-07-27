/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Preview from './preview';
import { PREVIEW_EXECUTE_DELAY_MS } from '../constants';

describe('Preview', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders a sandboxed iframe whose document handles runtime errors', () => {
    render(<Preview code="console.log(1);" err="" />);

    const iframe = screen.getByTitle('preview') as HTMLIFrameElement;
    expect(iframe).toHaveAttribute('sandbox', 'allow-scripts');
    expect(iframe.getAttribute('srcdoc')).toContain('Runtime Error');
    expect(iframe.getAttribute('srcdoc')).toContain("addEventListener('message'");
  });

  it('posts the bundled code into the iframe after the settle delay', () => {
    const { container } = render(<Preview code="show(42);" err="" />);
    const iframe = container.querySelector('iframe') as HTMLIFrameElement;
    const postMessage = vi.fn();
    Object.defineProperty(iframe, 'contentWindow', {
      value: { postMessage },
    });

    vi.advanceTimersByTime(PREVIEW_EXECUTE_DELAY_MS - 10);
    expect(postMessage).not.toHaveBeenCalled();

    vi.advanceTimersByTime(10);
    expect(postMessage).toHaveBeenCalledWith('show(42);', '*');
  });

  it('shows bundling errors over the preview', () => {
    render(<Preview code="" err="Cannot resolve module" />);
    expect(screen.getByText('Cannot resolve module')).toBeInTheDocument();
  });
});
