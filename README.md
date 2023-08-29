# Getting Started with Code Editor - a dynamic coding environment.

## This process will change once I'm down to implement this in a CLI.

- Clone the project to your local hard drive.
- Navigate to Node.js to download and install Node if you don't have it installed.
- Open an instance of Terminal and navigate to ../code-editor/jbook/packages/local-client
- Run ```npm install```
- Run ```npm i react --legacy-peer-deps```
- Run ```npm run start```

## Current Functionality

- All of the core functionality should be working except the ability to save your code and markdown to a file.
- I've created a function show() that works similar to console.log()
- Ability to import any npm module and use it without actually installing it.

## Code samples to play with in the code editor.

```
import React from 'react';
import ReactDOM from 'react-dom';

const App = () => {
  return <h1>Hi! I'm a react.js component!</h1>;
};
show(<App />);

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
