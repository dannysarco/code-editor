import "./cell-list.css";
import { Fragment, useEffect } from "react";
import { useTypedSelector } from "../hooks/use-typed-selector";
import { selectCells } from "../state";
import CellListItem from "./cell-list-item";
import AddCell from "./add-cell";
import ErrorBoundary from "./error-boundary";
import UndoRedoBar from "./undo-redo-bar";
import { useActions } from "../hooks/use-actions";

const CellList: React.FC = () => {
  const cells = useTypedSelector((state) => {
    const { order, data } = selectCells(state);
    return order.map((id) => data[id]);
  });
  const { fetchCells } = useActions();

  useEffect(() => {
    fetchCells();
  }, [fetchCells]); // Include fetchCells in the dependency array

  const renderedCells = cells.map((cell) => (
    <Fragment key={cell.id}>
      <ErrorBoundary>
        <CellListItem cell={cell} />
      </ErrorBoundary>
      <AddCell previousCellId={cell.id} />
    </Fragment>
  ));

  return (
    <div className="cell-list">
      <UndoRedoBar />
      <AddCell forceVisible={cells.length === 0} previousCellId={null} />
      {renderedCells}
    </div>
  );
};

export default CellList;
