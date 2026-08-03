// The document loaded into every preview iframe, in the app and in exported
// HTML alike (the export embeds this string, so both render cell output with
// exactly the same runtime). The shell installs its listeners, then reports
// ready to the parent; the parent posts the bundled code exactly once, on
// that signal. Console calls and runtime errors are forwarded to the parent
// as messages.
export const PREVIEW_SHELL_HTML = `
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
