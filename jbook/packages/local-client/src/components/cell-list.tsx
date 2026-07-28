import "./cell-list.css";
import { Fragment, useEffect, useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { useTypedSelector } from "../hooks/use-typed-selector";
import { selectCells } from "../state";
import CellListItem from "./cell-list-item";
import AddCell from "./add-cell";
import ExplainerText from "./example-text";
import { useActions } from "../hooks/use-actions";

const GUIDE_STORAGE_KEY = "scrapbook.guideOpen";

const readGuideOpen = (): boolean => {
  try {
    const stored = localStorage.getItem(GUIDE_STORAGE_KEY);
    return stored === null ? true : stored === "true";
  } catch {
    return true;
  }
};

const CellList: React.FC = () => {
  const cells = useTypedSelector((state) => {
    const { order, data } = selectCells(state);
    return order.map((id) => data[id]);
  });
  const { fetchCells, insertCellAfter } = useActions();

  // Don't flash the empty state before the initial fetch has answered.
  const [ready, setReady] = useState(false);
  const [guideOpen, setGuideOpen] = useState(readGuideOpen);

  useEffect(() => {
    // bindActionCreators types the bound thunk by its creator, but at runtime
    // it returns dispatch's result — the request promise.
    const request = fetchCells() as unknown as Promise<unknown>;
    request.finally(() => setReady(true));
  }, [fetchCells]);

  const toggleGuide = () => {
    setGuideOpen((open) => {
      const next = !open;
      try {
        localStorage.setItem(GUIDE_STORAGE_KEY, String(next));
      } catch {
        // Private-mode storage failures only lose persistence, not the toggle.
      }
      return next;
    });
  };

  if (ready && cells.length === 0) {
    return (
      <section className="empty-notebook">
        <h1>Start your notebook.</h1>
        <p className="empty-lede">
          A code cell runs JavaScript and renders its result beside it. A text
          cell is markdown for the documentation around it.
        </p>
        <div className="hr" />
        <div className="empty-actions">
          <button
            className="btn btn-primary"
            onClick={() => insertCellAfter(null, "code")}
          >
            <Plus size={14} />
            <span>Code cell</span>
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => insertCellAfter(null, "text")}
          >
            <Plus size={14} />
            <span>Text cell</span>
          </button>
        </div>
        <p className="empty-footnote">
          Saving to <span className="empty-file">notebook.js</span> in the
          folder you started from.
        </p>
      </section>
    );
  }

  const codeCount = cells.filter((cell) => cell.type === "code").length;
  const textCount = cells.length - codeCount;
  const summary = `${cells.length} cell${cells.length === 1 ? "" : "s"} · ${codeCount} code · ${textCount} text`;

  return (
    <>
      <div className="notebook-meta">
        <span className="meta-summary label">{summary}</span>
        <button
          className="btn btn-ghost guide-toggle"
          aria-expanded={guideOpen}
          onClick={toggleGuide}
        >
          {guideOpen ? "Hide guide" : "How this works"}
          <ChevronDown
            size={14}
            className={`guide-chevron ${guideOpen ? "open" : ""}`}
          />
        </button>
      </div>
      {guideOpen && <ExplainerText />}
      <main className="cell-list">
        <AddCell previousCellId={null} />
        {cells.map((cell, index) => (
          <Fragment key={cell.id}>
            <CellListItem cell={cell} index={index} />
            <AddCell previousCellId={cell.id} />
          </Fragment>
        ))}
      </main>
    </>
  );
};

export default CellList;
