import React from "react";

const ExplainerText: React.FC = () => {
  return (
    <div className="card-content" id="hide-show">
      <div className="wmde-markdown wmde-markdown-color ">
        <h2>
          <strong>Coding and Documentation Editor</strong>
        </h2>
        <p>
          This is an interactive coding environment. You can write Javascript,
          import any NPM modules and see it executed, and write comprehensive
          documentation using markdown.
        </p>
        <ul>
          <li>Click any text or code cell to edit it</li>
          <li>
            The code in each code editor is joined into one file. If you define
            a variable in cell #1, you can refer to it in any of the following
            cells!
          </li>
          <li>
            Click the <strong>Format</strong> button in any code cell, and
            Prettier will its thing to your code!
          </li>
          <li>
            You can show any React component, string, number, or anything else
            by calling the <code>show</code> function. This is a function built
            into this environment. Call show multiple times to show multiple
            values
          </li>
          <li>Re-order or delete cells using the buttons on the top right</li>
          <li>Add new cells by hovering on the divider between each cell</li>
        </ul>
      </div>
    </div>
  );
};

export default ExplainerText;
