# Getting Started with My Scrapbook - a dynamic coding environment.

[![CI](https://github.com/dannysarco/code-editor/actions/workflows/ci.yml/badge.svg?branch=live)](https://github.com/dannysarco/code-editor/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/my-scrapbook)](https://www.npmjs.com/package/my-scrapbook)

## What is My Scrapbook, and what does it do?

- It's a full-featured in-browser IDE and markdown editor for documentation.
- You can import any npm module in the IDE. The bundling and transpiling of your code are handled in the browser.
- React and ReactDOM are already imported and ready for use.
- All of your text and code are automatically saved to a file named notebook.js

## Install Instructions.

- You'll need [Node.js](https://nodejs.org/) 20 or newer.
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
  ![The start screen with Code cell and Text cell buttons](docs/images/blank.png)
  ![A text cell open in the markdown editor above a code cell](docs/images/editing.png)
- All your work is saved to the file **notebook.js**.
- Next time you run the application using the same command, it will open to your previous **notebook.js** file.
- If you want to start a new notebook and don't care about the saved work from your previous session, delete the **notebook.js** file in the same directory before starting My Scrapbook again. (Or you could leave the **notebook.js** and click the **X** button on all your previous work once the IDE is loaded into the browser.)
- If you want to keep your previous work and start a new notebook, rename or move the **notebook.js** file in the same directory before starting My Scrapbook again.
![The install folder showing the saved notebook.js file](docs/images/notebook-file.png)

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

## Share a notebook as a live HTML page

- Click **Export HTML** in the notebook's header to download the whole notebook as a single **notebook.html** file.
- The file is completely self-contained — open it in any browser, no My Scrapbook, server, or internet connection needed. Text cells keep their formatting, and code cells **actually run**: each one executes its bundled code in a sandboxed frame, renders its preview, and shows its console output, exactly like in the app.
- Each code cell's source is included too, behind a collapsible **Source** toggle.

## What's new in 3.8

- **Node 20 or newer is now required** (Node 18 reached end of life). Under the hood the CLI's dependencies moved to current majors — express 5 and commander 14 — so a command with stray extra arguments now fails with a clear error instead of being silently ignored.
- **Releases are verified end-to-end.** CI packs the npm packages, installs the real tarball into a clean project, and runs it — version check, notebook creation, API, and app shell — before anything ships.

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
- Versions 2.x are deprecated on npm: they can no longer render React components (they relied on an API that current React, served from unpkg, removed).

## Markdown sample text for the text editor that contains an "Explainer".

```
**My Scrapbook**
----------
This is an interactive coding environment. Write JavaScript or TypeScript, see it run as you type, and keep the documentation right next to the code in markdown.

- Click any text cell (including this one) to edit it
- Cells share one file — a variable defined in cell #1 works in every cell below it
- Call the built-in `show()` with a React component, string, number, or object to render it in the preview
- `console.log` output shows up in a console panel under the preview
- Import any npm package — bundling happens right in the browser, and packages you've used keep working offline
- Click **Format** in any code cell and Prettier tidies it up
- Reorder cells with the grip handle (or the arrows), and undo any of it with Ctrl/Cmd+Z

Everything you write saves to the file you opened — with a bare `npx my-scrapbook`, that's `notebook.js`.
```

## Code samples for the code editor.

TypeScript, React, and the console panel — types are stripped when the code runs, and `console.log` lands under the preview:

```tsx
import { useState } from 'react';

interface Task {
  title: string;
  done: boolean;
}

const initial: Task[] = [
  { title: 'Write some TypeScript', done: true },
  { title: 'Import an npm package', done: false },
  { title: 'Drag a cell somewhere new', done: false },
];

const TaskList = () => {
  const [tasks, setTasks] = useState(initial);
  const toggle = (title: string) =>
    setTasks(
      tasks.map((t) => (t.title === title ? { ...t, done: !t.done } : t))
    );

  return (
    <ul style={{ listStyle: 'none', padding: 4, fontFamily: 'sans-serif' }}>
      {tasks.map((t) => (
        <li
          key={t.title}
          onClick={() => toggle(t.title)}
          style={{ cursor: 'pointer', padding: 2 }}
        >
          {t.done ? '✅' : '⬜️'} {t.title}
        </li>
      ))}
    </ul>
  );
};

console.log('tasks:', initial.map((t) => t.title));
show(<TaskList />);
```

Any npm package works — including CSS. This fetches live data with axios and styles it with bulma:

```jsx
import axios from 'axios';
import 'bulma/css/bulma.css';

axios.get('https://jsonplaceholder.typicode.com/users').then(({ data }) => {
  console.log('fetched', data.length, 'users');
  show(
    <div className="content m-4">
      <h4>Team</h4>
      <ul>
        {data.slice(0, 4).map((user) => (
          <li key={user.id}>
            {user.name} — <em>{user.company.name}</em>
          </li>
        ))}
      </ul>
    </div>
  );
});
```
![A notebook with markdown documentation, a TypeScript task-list component with console output, and an npm-powered cell rendering live data](docs/images/sample.png)

## Development

The code lives in [`jbook/`](jbook), an npm-workspaces monorepo with four packages: the `my-scrapbook` CLI, the Express API (`local-api`), the browser app (`local-client`, built with Vite), and shared TypeScript types (`types`). You'll want Node 20+ for development.

```
cd jbook
npm install
npm test
```

To work on the browser app with hot reload, run `npm start` in `jbook/packages/local-client` (it serves on port 3000; run the CLI's `serve` command alongside it to have a real API to talk to). Each package's README has more detail, and CI runs the builds and tests on every pull request.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for the release history.

## Roadmap

See [TODO.md](TODO.md) for what's done and what's planned. Most of the original roadmap has shipped — undo/redo, offline module caching, TypeScript cells, drag-to-reorder, markdown export — with collaborative editing as the big remaining idea.
