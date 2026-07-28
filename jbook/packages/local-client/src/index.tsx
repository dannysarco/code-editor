// Self-hosted Lato replaces the Google Fonts @import that bulmaswatch's css
// carries (stripped at build time in vite.config.ts) so the app has no
// external requests at all.
import "@fontsource/lato/300.css";
import "@fontsource/lato/400.css";
import "@fontsource/lato/700.css";
import "bulmaswatch/superhero/bulmaswatch.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./state";
import CellList from "./components/cell-list";
import ExplainerText from "./components/example-text";

const App = () => {
  return (
    <Provider store={store}>
      <div>
        <ExplainerText />
      </div>
      <div>
        <CellList />
      </div>
    </Provider>
  );
};

const container = document.querySelector("#root");
if (!container) {
  throw new Error("Root element #root not found");
}
createRoot(container).render(<App />);
