[
  {
    content:
      "**My Scrap Book** \n----------\nThis is an interactive coding environment. You can write Javascript, see it executed, and write comprehensive documentation using markdown. \n\n- Click any text cell (including this one) to edit it \n- The code in each code editor is joined into one file. If you define a variable in cell #1, you can refer to it in any of the following cells! \n- You can show any React component, string, number, or anything else by calling the `show` function. This is a function built into this environment. Call show multiple times to show multiple values\n- Re-order or delete cells using the buttons on the top right\n- Add new cells by hovering on the divider between each cell\n\nAll of your changes get saved to the file you opened JBook with. So if you ran `npx jbook test.js`, all of the text and code you write will be saved to the `test.js` file.\n",
    type: "text",
    id: "qw4rr",
  },
  {
    content:
      "import { useState } from 'react';\r\n\r\nconst Counter = () => {\r\n  const [count, setCount] = useState(0);\r\n  return (\r\n    <div>\r\n      <button onClick={() => setCount(count + 1)}>Click</button>\r\n      <h3>Count: {count}</h3>\r\n    </div>\r\n  );\r\n};\r\n// Display any variable or React Component by calling 'show'\r\nshow(<Counter />);\r\n",
    type: "code",
    id: "ldq45",
  },
];
