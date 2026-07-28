import "./example-text.css";
import React from "react";

// The "How this works" strip that the meta bar's disclosure toggles open —
// a tightened rewrite of the old permanent explainer wall.
const GUIDE_ITEMS: React.ReactNode[] = [
  <>Click any text or code cell to edit it.</>,
  <>
    Cells share one file — a variable from cell 01 works in every cell below.
  </>,
  <>
    Call <code>show()</code> to render a component, string or number in the
    preview.
  </>,
  <>Import any npm package — bundling happens in the browser.</>,
];

const ExplainerText: React.FC = () => {
  return (
    <section className="guide-strip">
      <div className="guide-intro">
        <h4>Coding and documentation, in one file</h4>
        <p>Everything you write saves to notebook.js.</p>
      </div>
      <ol className="guide-items">
        {GUIDE_ITEMS.map((item, index) => (
          <li key={index} className="guide-item">
            <span className="guide-index" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
    </section>
  );
};

export default ExplainerText;
