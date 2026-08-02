# My Scrapbook - a dynamic coding environment.

[![CI](https://github.com/dannysarco/code-editor/actions/workflows/ci.yml/badge.svg?branch=live)](https://github.com/dannysarco/code-editor/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/my-scrapbook)](https://www.npmjs.com/package/my-scrapbook)

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
npx my-scrapbook
```
- Your browser opens to the notebook automatically. (Prefer to open it yourself? Pass `--no-open` and **Ctrl + click** the **http://localhost:4005** link in the terminal.)
- Want a different port or a named notebook? Both are options of the `serve` command (running `npx my-scrapbook` alone is shorthand for `npx my-scrapbook serve notebook.js`):

```
npx my-scrapbook serve mynotes.js -p 4200
```
- Click **Code cell** or **Text cell** on the start screen to create your first cell. After that, use the **+ Code** / **+ Text** buttons between cells to add more.
  ![The start screen with Code cell and Text cell buttons](https://raw.githubusercontent.com/dannysarco/code-editor/live/docs/images/blank.png)
  ![A text cell open in the markdown editor above a code cell](https://raw.githubusercontent.com/dannysarco/code-editor/live/docs/images/editing.png)
- All your work is saved to the file **notebook.js**.
- Next time you run the application using the same command, it will open to your previous **notebook.js** file.
- If you want to start a new notebook and don't care about the saved work from your previous session, delete the **notebook.js** file in the same directory before starting My Scrapbook again.
- If you want to keep your previous work and start a new notebook, rename or move the **notebook.js** file in the same directory before starting My Scrapbook again.

## Export a notebook to Markdown

- To turn a notebook into a plain markdown file you can share anywhere (GitHub, a blog, a teammate without My Scrapbook), run:

```
npx my-scrapbook export
```
- This writes **notebook.md** next to **notebook.js**: text cells come through as-is, and code cells become fenced ` ```jsx ` blocks.
- Exporting a named notebook to a specific file works too:

```
npx my-scrapbook export mynotes.js -o docs/mynotes.md
```

## What's new in 3.7

- **Drag cells to reorder them.** Grab the grip handle in any cell's header and drop the cell where you want it — or use it from the keyboard (space to lift, arrows to move, space to drop). A drag is a single undo step, and the new order saves like any other edit. The one-step arrow buttons are still there.

## What's new in 3.6

- **Unchanged cells don't rebundle.** Bundle results are now cached, so reopening an unchanged notebook is instant, and undo/redo, moving a cell and moving it back, and **Run all** skip esbuild for anything already bundled — those cells say "Bundled from cache". **Clear cache** resets both the bundle and npm module caches.

## What's new in 3.5

- **TypeScript in code cells.** Interfaces, type annotations, and generics all work — the editor highlights TS properly, the **Format** button understands it, and types are stripped when your code runs (no type checking). Plain JavaScript works exactly as before.

## What's new in 3.4

- **Console output in the preview.** `console.log` (and `info`/`warn`/`error`/`debug`) from your code now shows up in a console panel right under the preview — objects serialized, warnings and errors highlighted, with a **Clear** button. No more digging through the browser devtools.
- **The preview no longer goes randomly blank.** Bundled code used to be handed to the preview on a fixed timer and was silently lost if the preview loaded slower; it's now delivered on an explicit ready signal, every time.

## What's new in 3.3

- **Markdown export.** `npx my-scrapbook export` turns a notebook into a plain markdown file you can share anywhere — see "Export a notebook to Markdown" above.
- **Smoother start.** A bare `npx my-scrapbook` now opens `notebook.js` and launches your browser automatically (pass `--no-open` to opt out). The CLI also reports its version with `--version` and warns at install time on Node versions older than 18.

## What's new in 3.2

- **Redesigned UI.** A light, flat look with a single red accent replaces the old dark theme: a sticky header with the notebook's save state, undo/redo, **Clear cache**, and **Run all**; a collapsible "How this works" guide; a start screen for empty notebooks; numbered cell headers with live bundle timing; and always-visible add-cell rails. Same features, new chrome.

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
