// Self-host Monaco: bundle the editor from the installed monaco-editor
// package instead of @monaco-editor/react's default CDN loader, so the app
// works fully offline. Vite's ?worker imports produce the web workers Monaco
// needs; only the base editor worker and the typescript worker are included
// since the notebook only edits JavaScript.
import * as monaco from 'monaco-editor';
import { loader } from '@monaco-editor/react';
import EditorWorker from 'monaco-editor/editor/editor.worker.js?worker';
import TsWorker from 'monaco-editor/language/typescript/ts.worker.js?worker';

// The Modernist code theme: dark neutral-900 pane inside light chrome, with
// syntax colors drawn from the design system's neutral and accent ramps.
monaco.editor.defineTheme('modernist-dark', {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: '', foreground: 'eae7e7', background: '2d2b2b' },
    { token: 'keyword', foreground: 'ff9783' },
    { token: 'string', foreground: 'bab6b6' },
    { token: 'number', foreground: 'bab6b6' },
    { token: 'regexp', foreground: 'bab6b6' },
    { token: 'comment', foreground: '7d7979', fontStyle: 'italic' },
    { token: 'identifier', foreground: 'f8f4f4' },
    { token: 'type.identifier', foreground: 'ffc4b8' },
    { token: 'delimiter', foreground: '9b9797' },
    { token: 'delimiter.bracket', foreground: '9b9797' },
    { token: 'delimiter.parenthesis', foreground: '9b9797' },
    { token: 'operator', foreground: '9b9797' },
    { token: 'invalid', foreground: 'ff563c' },
  ],
  colors: {
    'editor.background': '#2d2b2b',
    'editor.foreground': '#eae7e7',
    'editorLineNumber.foreground': '#605d5d',
    'editorLineNumber.activeForeground': '#9b9797',
    'editorCursor.foreground': '#ff563c',
    'editor.selectionBackground': '#444141',
    'editor.lineHighlightBackground': '#2d2b2b',
    'editorError.foreground': '#ff563c',
    'editorWarning.foreground': '#ff9783',
    'editorWidget.background': '#444141',
    'editorSuggestWidget.background': '#444141',
    'scrollbarSlider.background': '#44414180',
    'scrollbarSlider.hoverBackground': '#605d5d80',
  },
});

self.MonacoEnvironment = {
  getWorker(_workerId: string, label: string) {
    if (label === 'typescript' || label === 'javascript') {
      return new TsWorker();
    }
    return new EditorWorker();
  },
};

loader.config({ monaco });
