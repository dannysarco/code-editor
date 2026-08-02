import "./cell-list.css";
import { useEffect, useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useTypedSelector } from "../hooks/use-typed-selector";
import { selectCells } from "../state";
import SortableCell from "./sortable-cell";
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
  const { fetchCells, insertCellAfter, reorderCell } = useActions();

  // Don't flash the empty state before the initial fetch has answered.
  const [ready, setReady] = useState(false);
  const [guideOpen, setGuideOpen] = useState(readGuideOpen);
  // While a drag is live, previews get pointer-events: none — an iframe
  // under the cursor would otherwise swallow the pointermove stream.
  const [dragging, setDragging] = useState(false);

  // A small activation distance keeps plain clicks on the grip from starting
  // a drag; the keyboard sensor makes the handle work with space + arrows.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDragEnd = (event: DragEndEvent) => {
    setDragging(false);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const toIndex = cells.findIndex((cell) => cell.id === over.id);
      reorderCell(String(active.id), toIndex);
    }
  };

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
      <main className={`cell-list${dragging ? " is-dragging" : ""}`}>
        <AddCell previousCellId={null} />
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={() => setDragging(true)}
          onDragCancel={() => setDragging(false)}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={cells.map((cell) => cell.id)}
            strategy={verticalListSortingStrategy}
          >
            {cells.map((cell, index) => (
              <SortableCell key={cell.id} cell={cell} index={index} />
            ))}
          </SortableContext>
        </DndContext>
      </main>
    </>
  );
};

export default CellList;
