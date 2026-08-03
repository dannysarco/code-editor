import type { Cell } from '../state/cell';

// The notebook a first-time demo visitor lands on. The point of the demo is
// watching code run, so it opens populated: the same explainer and samples
// the README uses, plus a closing pointer to the CLI. IDs are only opaque
// keys; fixed values keep the seed deterministic.
export const demoSeedCells: Cell[] = [
  {
    id: 'demo-explainer',
    type: 'text',
    content: `**My Scrapbook**
----------
This is an interactive coding environment. Write JavaScript or TypeScript, see it run as you type, and keep the documentation right next to the code in markdown.

- Click any text cell (including this one) to edit it
- Cells share one file — a variable defined in cell #1 works in every cell below it
- Call the built-in \`show()\` with a React component, string, number, or object to render it in the preview
- \`console.log\` output shows up in a console panel under the preview
- Import any npm package — bundling happens right in the browser, and packages you've used keep working offline
- Click **Format** in any code cell and Prettier tidies it up
- Reorder cells with the grip handle (or the arrows), and undo any of it with Ctrl/Cmd+Z

This is the hosted demo, so everything you write is saved in this browser.`,
  },
  {
    id: 'demo-typescript',
    type: 'code',
    content: `import { useState } from 'react';

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
show(<TaskList />);`,
  },
  {
    id: 'demo-npm-intro',
    type: 'text',
    content: `Any npm package works — including CSS. The cell below fetches live data with **axios** and styles it with **bulma**; both are fetched from unpkg and bundled right here in the browser.`,
  },
  {
    id: 'demo-npm',
    type: 'code',
    content: `import axios from 'axios';
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
});`,
  },
  {
    id: 'demo-outro',
    type: 'text',
    content: `**Like it? The real thing runs on your machine.**

\`\`\`
npm i my-scrapbook
npx my-scrapbook
\`\`\`

The CLI saves your notebook as a plain \`notebook.js\` file in the folder you run it from, works fully offline, and can convert notebooks to and from markdown (\`npx my-scrapbook export\` / \`import\`). Use **Download notebook.js** in the header to take what you've written here with you.`,
  },
];
