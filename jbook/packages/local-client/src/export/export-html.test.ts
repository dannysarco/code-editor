import { describe, expect, it } from 'vitest';
import { buildExportHtml, ExportCell } from './export-html';

const exportedAt = new Date(2026, 7, 2, 12, 0, 0);

const textCell = (html: string): ExportCell => ({ type: 'text', html });
const codeCell = (overrides: Partial<Extract<ExportCell, { type: 'code' }>> = {}): ExportCell => ({
  type: 'code',
  id: 'cell-1',
  source: 'show(1)',
  bundledCode: 'var show = () => {}; console.log(1);',
  bundleErr: '',
  ...overrides,
});

describe('buildExportHtml', () => {
  it('produces a full document with cells in order and numbered headers', () => {
    const html = buildExportHtml(
      [textCell('<h1>Notes</h1>'), codeCell({ id: 'abc' })],
      exportedAt
    );

    expect(html).toMatch(/^<!doctype html>/);
    expect(html).toContain('<h1>Notes</h1>');
    expect(html.indexOf('<h1>Notes</h1>')).toBeLessThan(
      html.indexOf('data-cell="abc"')
    );
    expect(html).toContain('<span>01</span><span>TEXT</span>');
    expect(html).toContain('<span>02</span><span>CODE</span>');
  });

  it('escapes code cell source so markup in it stays inert', () => {
    const html = buildExportHtml(
      [codeCell({ source: 'show(<b>{"</b>"}</b>)' })],
      exportedAt
    );

    expect(html).toContain('show(&lt;b&gt;');
    expect(html).not.toContain('show(<b>');
  });

  it('embeds bundles so a </script> inside bundled code cannot end the runtime script', () => {
    const html = buildExportHtml(
      [codeCell({ bundledCode: 'console.log("</script><script>bad()")' })],
      exportedAt
    );

    // The only literal closing tag is the runtime script's own.
    expect(html.match(/<\/script>/g)).toHaveLength(1);
    expect(html).toContain('\\u003c/script>');
  });

  it('sandboxes every preview iframe', () => {
    const html = buildExportHtml(
      [codeCell({ id: 'a' }), codeCell({ id: 'b' })],
      exportedAt
    );

    const iframes = html.match(/<iframe[^>]*>/g) ?? [];
    expect(iframes).toHaveLength(2);
    for (const tag of iframes) {
      expect(tag).toContain('sandbox="allow-scripts"');
    }
  });

  it('shows the bundler error instead of a preview for cells that failed to bundle', () => {
    const html = buildExportHtml(
      [codeCell({ bundleErr: 'Unexpected token "<"', bundledCode: '' })],
      exportedAt
    );

    expect(html).toContain('Unexpected token &quot;&lt;&quot;');
    expect(html).not.toContain('<iframe');
    // No bundle is embedded for a failed cell.
    expect(html).toContain('var BUNDLES = {};');
  });
});
