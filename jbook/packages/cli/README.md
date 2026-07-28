# My Scrapbook - a dynamic coding environment.

## What is My Scrapbook, and what does it do?

- It's a full-featured in-browser IDE and markdown editor for documentation.
- You can import any npm module in the IDE. The bundling and transpiling of your code are handled in the browser.
- React and ReactDOM are already imported and ready for use.
- All of your text and code are automatically saved to a file named notebook.js

## Install Instructions.

- You'll need [Node.js](https://nodejs.org/) 18 or newer.
- Open a folder on your terminal where you don't mind a few files being written.
- Run the following command:
```
npm i my-scrapbook
```
## To Run My Scrapbook

- In the same folder you install My Scrapbook, open up a terminal session and run:

```
npx my-scrapbook serve
```
- **Ctrl + click** on the link in the terminal that says **http://localhost:4005**
- Click **Code cell** or **Text cell** on the start screen to create your first cell. After that, use the **+ Code** / **+ Text** buttons between cells to add more.
  ![The start screen with Code cell and Text cell buttons](https://raw.githubusercontent.com/dannysarco/code-editor/live/docs/images/blank.png)
  ![A text cell open in the markdown editor above a code cell](https://raw.githubusercontent.com/dannysarco/code-editor/live/docs/images/editing.png)
- All your work is saved to the file **notebook.js**.
- Next time you run the application using the same command, it will open to your previous **notebook.js** file.
- If you want to start a new notebook and don't care about the saved work from your previous session, delete the **notebook.js** file in the same directory before starting My Scrapbook again.
- If you want to keep your previous work and start a new notebook, rename or move the **notebook.js** file in the same directory before starting My Scrapbook again.

## What's new in 3.1

- **Undo/redo**: toolbar buttons plus Ctrl/Cmd+Z, Ctrl+Y, and Ctrl/Cmd+Shift+Z. Typing bursts undo as one step; the shortcuts stay out of the way while you're typing inside an editor.
- **Works fully offline**: the editor and fonts are bundled with the app, and npm packages you've used before are served from a local cache — a badge tells you when you're offline, and a button clears the module cache to pick up fresh package versions.

## What's new in 3.0

- Rebuilt on a modern toolchain: Vite, TypeScript 5, React 18, and Redux Toolkit.
- The in-browser bundler ships its own copy of esbuild, so bundling no longer depends on a CDN.
- A crashed cell shows an error message with a Reset button instead of taking down the whole notebook.
- The save API validates what it writes, and a corrupted notebook.js can no longer crash the server.
- Versions 2.x are deprecated: they can no longer render React components (they relied on an API that current React, served from unpkg, removed).

## Example

```js
import { useState } from 'react';

const Counter = () => {
  const [count, setCount] = useState(0);
  return (
    <div>
      <button onClick={() => setCount(count + 1)}>Click</button>
      <h3>Count: {count}</h3>
    </div>
  );
}; // Display any variable or React Component by calling 'show'
show(<Counter />);
```

![A notebook with markdown documentation and a React counter component rendered in the preview](https://raw.githubusercontent.com/dannysarco/code-editor/live/docs/images/sample.png)

## Source & development

The code lives at [dannysarco/code-editor](https://github.com/dannysarco/code-editor) — see the repository README for the development setup and [TODO.md](https://github.com/dannysarco/code-editor/blob/live/TODO.md) for the roadmap.
