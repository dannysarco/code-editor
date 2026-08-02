import './preview.css';
import { useRef, useEffect, useState } from 'react';
import { MAX_CONSOLE_ENTRIES } from '../constants';

interface PreviewProps {
  code: string;
  err: string;
}

type ConsoleLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

interface ConsoleEntry {
  level: ConsoleLevel;
  text: string;
}

const html = `
    <html>
      <head>
        <style>html { background-color: white; }</style>
      </head>
      <body>
        <div id="root"></div>
        <script>
          // Console arguments can hold anything (cyclic objects, functions,
          // DOM nodes) so they can't cross postMessage as-is; flatten each to
          // a string on this side of the boundary.
          const serialize = (value) => {
            if (typeof value === 'string') return value;
            if (value instanceof Error) return String(value);
            if (typeof value === 'object' && value !== null) {
              const seen = new WeakSet();
              try {
                const json = JSON.stringify(value, (key, v) => {
                  if (typeof v === 'object' && v !== null) {
                    if (seen.has(v)) return '[Circular]';
                    seen.add(v);
                  }
                  if (typeof v === 'function') return String(v);
                  if (typeof v === 'bigint') return v.toString() + 'n';
                  return v;
                });
                if (json !== undefined) return json;
              } catch (err) {}
            }
            return String(value);
          };

          ['log', 'info', 'warn', 'error', 'debug'].forEach((level) => {
            const original = console[level].bind(console);
            console[level] = (...args) => {
              original(...args);
              window.parent.postMessage({
                source: 'preview-console',
                level,
                text: args.map(serialize).join(' '),
              }, '*');
            };
          });

          const handleError = (err) => {
            const root = document.querySelector('#root');
            root.innerHTML = '<div style="color: red;"><h4>Runtime Error</h4>' + err + '</div>';
            console.error(err);
          };

          window.addEventListener('error', (event) => {
            event.preventDefault();
            handleError(event.error);
          });

          window.addEventListener('message', (event) => {
            try {
              eval(event.data);
            } catch (err) {
              handleError(err);
            }
          }, false);

          // Everything is installed; tell the parent this document can accept
          // code. Posting on a fixed timer instead used to drop the bundle
          // whenever the iframe loaded slower than the delay.
          window.parent.postMessage({ source: 'preview-ready' }, '*');
        </script>
      </body>
    </html>
  `;

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
    iframe.current.srcdoc = html;
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
