import './preview.css';
import { useRef, useEffect } from 'react';
import { PREVIEW_EXECUTE_DELAY_MS } from '../constants';

interface PreviewProps {
  code: string;
  err: string;
}

const html = `
    <html>
      <head>
        <style>html { background-color: white; }</style>
      </head>
      <body>
        <div id="root"></div>
        <script>
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
        </script>
      </body>
    </html>
  `;

const Preview: React.FC<PreviewProps> = ({ code, err }) => {
  const iframe = useRef<any>();

  useEffect(() => {
    if (!iframe.current) {
      return;
    }
    iframe.current.srcdoc = html;
    const timer = setTimeout(() => {
      // The component may unmount (or the iframe detach) before the settle
      // delay elapses; an uncancelled timer would then dereference null.
      iframe.current?.contentWindow?.postMessage(code, '*');
    }, PREVIEW_EXECUTE_DELAY_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [code]);

  return (
    <div className="preview-wrapper">
      <iframe
        title="preview"
        ref={iframe}
        sandbox="allow-scripts"
        srcDoc={html}
      />
      {err && <div className="preview-error">{err}</div>}
    </div>
  );
};

export default Preview;
