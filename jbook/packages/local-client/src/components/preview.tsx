import './preview.css';
import { useRef, useEffect, useState } from 'react';
import { MAX_CONSOLE_ENTRIES } from '../constants';
import { PREVIEW_SHELL_HTML } from './preview-shell';

interface PreviewProps {
  code: string;
  err: string;
}

type ConsoleLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

interface ConsoleEntry {
  level: ConsoleLevel;
  text: string;
}


const Preview: React.FC<PreviewProps> = ({ code, err }) => {
  const iframe = useRef<any>();
  const consoleBody = useRef<HTMLDivElement | null>(null);
  // Held until the iframe document reports ready; posting sooner loses the
  // message because the document's listener doesn't exist yet.
  const pendingCode = useRef<string | null>(null);
  const [logs, setLogs] = useState<ConsoleEntry[]>([]);

  useEffect(() => {
    if (!iframe.current) {
      return;
    }
    setLogs([]);
    pendingCode.current = code;
    // The iframe deliberately has no srcDoc attribute in JSX: this assignment
    // is the only load, so exactly one document fires 'ready' and executes
    // the code. (Assigning srcdoc always reloads, even with the same value.)
    iframe.current.srcdoc = PREVIEW_SHELL_HTML;
  }, [code]);

  useEffect(() => {
    // Every Preview on the page listens on the same window; the source check
    // keeps one cell's messages out of another cell's preview.
    const onMessage = (event: MessageEvent) => {
      if (event.source !== iframe.current?.contentWindow) {
        return;
      }

      if (event.data?.source === 'preview-ready') {
        if (pendingCode.current !== null) {
          iframe.current?.contentWindow?.postMessage(pendingCode.current, '*');
          pendingCode.current = null;
        }
        return;
      }

      if (event.data?.source === 'preview-console') {
        const entry: ConsoleEntry = {
          level: event.data.level,
          text: String(event.data.text),
        };
        setLogs((prev) => [...prev, entry].slice(-MAX_CONSOLE_ENTRIES));
      }
    };

    window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('message', onMessage);
    };
  }, []);

  useEffect(() => {
    if (consoleBody.current) {
      consoleBody.current.scrollTop = consoleBody.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="preview-wrapper">
      <iframe title="preview" ref={iframe} sandbox="allow-scripts" />
      {err && <div className="preview-error">{err}</div>}
      {logs.length > 0 && (
        <div className="preview-console">
          <div className="preview-console-header">
            <span className="preview-console-title">
              Console ({logs.length}
              {logs.length >= MAX_CONSOLE_ENTRIES ? ', oldest dropped' : ''})
            </span>
            <button
              className="preview-console-clear"
              onClick={() => setLogs([])}
            >
              Clear
            </button>
          </div>
          <div className="preview-console-body" ref={consoleBody}>
            {logs.map((entry, i) => (
              <div
                key={i}
                className={`preview-console-entry preview-console-${entry.level}`}
              >
                {entry.text}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Preview;
