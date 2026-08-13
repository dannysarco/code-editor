import './code-cell.css';
import { useEffect, useState } from 'react';
import CodeEditor from './code-editor';
import Preview from './preview';
import Resizable from './resizable';
import { Cell } from '../state';
import { BUNDLE_DEBOUNCE_MS } from '../constants';
import { useActions } from '../hooks/use-actions';
import { useTypedSelector } from '../hooks/use-typed-selector';
import { useCumulativeCode } from '../hooks/use-cumulative-code';
import { useIsMobile } from '../hooks/use-media-query';

interface CodeCellProps {
  cell: Cell;
}

const CodeCell: React.FC<CodeCellProps> = ({ cell }) => {
  const { updateCell, createBundle } = useActions();
  const bundle = useTypedSelector((state) => state.bundles[cell.id]);
  const cumulativeCode = useCumulativeCode(cell.id);

  // While re-bundling, the preview keeps showing the last good result under
  // the progress track instead of being torn down.
  const [lastBundle, setLastBundle] = useState<{
    code: string;
    err: string;
  } | null>(null);

  useEffect(() => {
    if (bundle && !bundle.loading) {
      setLastBundle({ code: bundle.code, err: bundle.err });
    }
  }, [bundle]);

  useEffect(() => {
    if (!bundle) {
      createBundle(cell.id, cumulativeCode);
      return;
    }

    const timer = setTimeout(async () => {
      createBundle(cell.id, cumulativeCode);
    }, BUNDLE_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cumulativeCode, cell.id, createBundle]);

  const bundling = !bundle || bundle.loading;
  const display = bundling ? lastBundle : bundle;

  // On mobile the panes stack vertically (CSS splits the height 50/50), so
  // the horizontal editor/preview resizer has nothing to resize.
  const isMobile = useIsMobile();
  const editor = (
    <CodeEditor
      initialValue={cell.content}
      onChange={(value) => updateCell(cell.id, value)}
    />
  );

  return (
    <Resizable direction="vertical">
      <div className={isMobile ? 'code-cell stacked' : 'code-cell'}>
        {isMobile ? editor : <Resizable direction="horizontal">{editor}</Resizable>}
        <div className="preview-pane">
          <div className="pane-toolbar preview-toolbar">
            <span className="label">Preview</span>
            <span className="live-dot" aria-hidden="true" />
          </div>
          <div className="preview-body">
            {bundling && (
              <div
                className="bundle-track"
                role="progressbar"
                aria-label="Bundling"
              >
                <div className="bundle-track-fill" />
              </div>
            )}
            {display && <Preview code={display.code} err={display.err} />}
          </div>
        </div>
      </div>
    </Resizable>
  );
};

export default CodeCell;
