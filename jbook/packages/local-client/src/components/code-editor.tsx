import '../monaco-setup';
import './code-editor.css';
import './syntax.css';
import { useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import prettier from 'prettier/standalone';
import parser from 'prettier/parser-babel';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import MonacoJSXHighlighter, { makeBabelParse } from 'monaco-jsx-highlighter';
import { JSX_HIGHLIGHT_DEBOUNCE_MS } from '../constants';

// Configures @babel/parser for module source type + JSX with error recovery;
// the raw parse function rejects top-level import/export statements.
const babelParse = makeBabelParse(parse);

interface CodeEditorProps {
  initialValue: string;
  onChange(value: string): void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ onChange, initialValue }) => {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  const onEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    editor.getModel()?.updateOptions({ tabSize: 2 });

    const highlighter = new MonacoJSXHighlighter(
      monaco,
      babelParse,
      traverse,
      editor
    );
    // Silence the parse/highlight error handlers: user code is routinely
    // invalid mid-keystroke and the defaults log every attempt.
    highlighter.highlightOnDidChangeModelContent(
      JSX_HIGHLIGHT_DEBOUNCE_MS,
      undefined,
      () => {},
      undefined,
      () => {}
    );
    // highlightOnDidChangeModelContent only fires on edits; highlight the
    // initial cell content too (a no-op error handler for invalid saved code).
    highlighter.highlightCode(undefined, () => {}, undefined, () => {});
  };

  const onFormatClick = () => {
    if (!editorRef.current) {
      return;
    }

    // get current value from editor
    const unformatted = editorRef.current.getModel()?.getValue() || '';

    // format that value
    const formatted = prettier
      .format(unformatted, {
        parser: 'babel',
        plugins: [parser],
        useTabs: false,
        semi: true,
        singleQuote: true,
      })
      .replace(/\n$/, '');

    // set the formatted value back in the editor
    editorRef.current.setValue(formatted);
  };

  return (
    <div className="editor-wrapper">
      <div className="pane-toolbar editor-toolbar">
        <span className="label editor-language">JavaScript</span>
        <button className="format-btn" onClick={onFormatClick}>
          Format
        </button>
      </div>
      <div className="editor-host">
        <Editor
          onMount={onEditorMount}
          value={initialValue}
          onChange={(value) => onChange(value ?? '')}
          theme="modernist-dark"
          language="javascript"
          height="100%"
          options={{
            wordWrap: 'on',
            minimap: { enabled: false },
            showUnused: false,
            folding: false,
            lineNumbersMinChars: 3,
            fontSize: 13.5,
            lineHeight: 22,
            fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  );
};

export default CodeEditor;
