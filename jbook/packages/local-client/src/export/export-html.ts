import { PREVIEW_SHELL_HTML } from '../components/preview-shell';
import { MAX_CONSOLE_ENTRIES } from '../constants';

// Everything the page builder needs per cell, precomputed by the caller:
// text cells arrive as rendered markdown, code cells as their source plus
// the bundled (or failed) output.
export type ExportCell =
  | { type: 'text'; html: string }
  | {
      type: 'code';
      id: string;
      source: string;
      bundledCode: string;
      bundleErr: string;
    };

const escapeHtml = (text: string): string =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// Serialized values are embedded inside an inline <script>; a literal "</"
// (as in a closing </script> tag inside bundled code) would end that script
// element mid-string, so every "<" is escaped into the JSON string form.
const embedJson = (value: unknown): string =>
  JSON.stringify(value).replace(/</g, '\\u003c');

const STYLES = `
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: #f4f2ee;
    color: #191919;
    font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
    line-height: 1.55;
  }
  .page { max-width: 860px; margin: 0 auto; padding: 32px 24px 64px; }
  .export-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-bottom: 18px;
    margin-bottom: 28px;
    border-bottom: 2px solid #d9d5cd;
  }
  .export-header .brand-mark { width: 14px; height: 14px; background: #e33d2e; }
  .export-header .brand-name { font-weight: 700; font-size: 17px; letter-spacing: -0.015em; }
  .export-header .export-meta { margin-left: auto; font-size: 12px; color: #6f6a62; }
  .cell { background: #ffffff; border: 1px solid #d9d5cd; margin-bottom: 26px; }
  .cell-header {
    display: flex;
    gap: 10px;
    padding: 8px 14px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: #6f6a62;
    border-bottom: 1px solid #ece9e3;
  }
  .text-cell-body { padding: 6px 18px 14px; }
  .text-cell-body :first-child { margin-top: 8px; }
  .text-cell-body pre, .text-cell-body code {
    background: #f4f2ee;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.92em;
  }
  .text-cell-body pre { padding: 10px 12px; overflow-x: auto; }
  .text-cell-body blockquote { border-left: 3px solid #d9d5cd; margin-left: 0; padding-left: 14px; color: #52504b; }
  .text-cell-body table { border-collapse: collapse; }
  .text-cell-body th, .text-cell-body td { border: 1px solid #d9d5cd; padding: 4px 10px; }
  .text-cell-body img { max-width: 100%; }
  .code-source summary {
    cursor: pointer;
    padding: 8px 14px;
    font-size: 12px;
    color: #6f6a62;
    user-select: none;
  }
  .code-source pre {
    margin: 0;
    padding: 12px 16px;
    overflow-x: auto;
    background: #23241f;
    color: #f2f1ef;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 13px;
    line-height: 1.5;
  }
  .preview { border-top: 1px solid #ece9e3; }
  .preview-frame { resize: vertical; overflow: hidden; height: 240px; min-height: 80px; }
  .preview-frame iframe { display: block; border: 0; width: 100%; height: 100%; background: #fff; }
  .preview-error {
    margin: 0;
    padding: 12px 16px;
    color: #b3261e;
    background: #fdf1f0;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 13px;
    white-space: pre-wrap;
  }
  .preview-console { border-top: 1px solid #ece9e3; display: none; }
  .preview-console-title {
    display: block;
    padding: 6px 14px 0;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: #6f6a62;
  }
  .preview-console-body {
    max-height: 180px;
    overflow-y: auto;
    padding: 6px 14px 10px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 12px;
  }
  .preview-console-entry { padding: 1px 0; white-space: pre-wrap; }
  .preview-console-warn { color: #8a6d00; }
  .preview-console-error { color: #b3261e; }
  .export-footer { font-size: 12px; color: #6f6a62; }
  noscript { display: block; padding: 12px 16px; color: #b3261e; }
`;

// The script that brings the exported page's previews to life. It mirrors
// what the app's Preview component does: load the shared shell into each
// iframe, post the cell's bundled code when the shell reports ready, and
// render forwarded console messages under the frame. Written in plain,
// pre-ES2020 JS since it ships to whatever browser opens the file.
const runtimeScript = (
  shellJson: string,
  bundlesJson: string
): string => `
  var SHELL = ${shellJson};
  var BUNDLES = ${bundlesJson};
  var frames = document.querySelectorAll('iframe[data-cell]');

  frames.forEach(function (frame) {
    frame.srcdoc = SHELL;
  });

  var frameFor = function (source) {
    for (var i = 0; i < frames.length; i++) {
      if (frames[i].contentWindow === source) return frames[i];
    }
    return null;
  };

  window.addEventListener('message', function (event) {
    var frame = frameFor(event.source);
    if (!frame || !event.data) return;

    if (event.data.source === 'preview-ready') {
      frame.contentWindow.postMessage(BUNDLES[frame.getAttribute('data-cell')], '*');
      return;
    }

    if (event.data.source === 'preview-console') {
      var cell = frame.closest('.cell');
      var panel = cell.querySelector('.preview-console');
      var body = cell.querySelector('.preview-console-body');
      var entry = document.createElement('div');
      entry.className = 'preview-console-entry preview-console-' + event.data.level;
      entry.textContent = String(event.data.text);
      body.appendChild(entry);
      while (body.children.length > ${MAX_CONSOLE_ENTRIES}) {
        body.removeChild(body.firstChild);
      }
      panel.style.display = 'block';
      body.scrollTop = body.scrollHeight;
    }
  });
`;

const cellNumber = (index: number): string =>
  String(index + 1).padStart(2, '0');

export const buildExportHtml = (
  cells: ExportCell[],
  exportedAt: Date
): string => {
  const bundles: Record<string, string> = {};
  const sections = cells.map((cell, index) => {
    const header = `<div class="cell-header"><span>${cellNumber(
      index
    )}</span><span>${cell.type === 'text' ? 'TEXT' : 'CODE'}</span></div>`;

    if (cell.type === 'text') {
      return `<section class="cell">${header}<div class="text-cell-body">${cell.html}</div></section>`;
    }

    const source = `<details class="code-source"><summary>Source</summary><pre><code>${escapeHtml(
      cell.source
    )}</code></pre></details>`;

    // A cell that failed to bundle has nothing to execute; show the bundler's
    // error where the preview would be, like the app does.
    const preview = cell.bundleErr
      ? `<div class="preview"><pre class="preview-error">${escapeHtml(
          cell.bundleErr
        )}</pre></div>`
      : `<div class="preview"><div class="preview-frame"><iframe title="preview ${cellNumber(
          index
        )}" sandbox="allow-scripts" data-cell="${escapeHtml(
          cell.id
        )}"></iframe></div><div class="preview-console"><span class="preview-console-title">CONSOLE</span><div class="preview-console-body"></div></div></div>`;

    if (!cell.bundleErr) {
      bundles[cell.id] = cell.bundledCode;
    }
    return `<section class="cell">${header}${source}${preview}</section>`;
  });

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>My Scrapbook export</title>
<style>${STYLES}</style>
</head>
<body>
<div class="page">
<header class="export-header">
  <span class="brand-mark"></span>
  <span class="brand-name">MY SCRAPBOOK</span>
  <span class="export-meta">Exported ${escapeHtml(
    exportedAt.toLocaleString()
  )}</span>
</header>
<noscript>Code cell previews need JavaScript to run; enable it to see them.</noscript>
${sections.join('\n')}
<footer class="export-footer">Made with <a href="https://www.npmjs.com/package/my-scrapbook">My Scrapbook</a> — code cells run live in sandboxed frames, entirely inside this file.</footer>
</div>
<script>${runtimeScript(
    embedJson(PREVIEW_SHELL_HTML),
    embedJson(bundles)
  )}</script>
</body>
</html>
`;
};
