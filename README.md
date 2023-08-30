# Getting Started with Code Editor - a dynamic coding environment.

## This process will change once I'm down to implement this in a CLI.

- Clone the project to your local hard drive.
- Navigate to Node.js to download and install Node if you don't have it installed.
- Open an instance of Terminal and navigate to ../code-editor/jbook/packages/local-client
- Run the following individually, in order:
```
npm install
```
```
npm i react --legacy-peer-deps
```
```
npm run start
```

## Current Functionality

- All of the core functionality should be working except the ability to save your code and markdown to a file.
- I've created a function show() that works similar to console.log()
- Ability to import any npm module and use it without actually installing it.

## Markdown example for the text editor with "Explainer."

```
**My Scrap Book** 
----------
This is an interactive coding environment. You can write Javascript, see it executed, and write comprehensive documentation using markdown. 

- Click any text cell (including this one) to edit it 
- The code in each code editor is joined into one file. If you define a variable in cell #1, you can refer to it in any of the following cells! 
- You can show any React component, string, number, or anything else by calling the `show` function. This is a function built into this environment. Call show multiple times to show multiple values
- Re-order or delete cells using the buttons on the top right
- Add new cells by hovering on the divider between each cell

All of your changes get saved to the file you opened JBook with. So if you ran `npx jbook notebook.js`, all of the text and code you write will be saved to the `notebook.js` file.

```

## Code samples to play with in the code editor.

```
import { useState } from 'react';

const Counter = () => {
  const [count, setCount] = useState(0);
  return (
    <div>
      <button onClick={() => setCount(count + 1)}>Click</button>
      <h3>Count: {count}</h3>
    </div>
  );
};
// Display any variable or React Component by calling 'show'
show(<Counter />);

```

```
  import axios from 'axios';
  import 'bulma/css/bulma.css';

  axios.get('http://jsonplaceholder.typicode.com/users/1')
  .then(({ data }) => show(data.name));
```


## Future Functionality

- Ability to install this from a CLI
- Ability to save your work to a file from a CLI
