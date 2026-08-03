// Self-hosted Archivo (the Modernist design system's typeface) so the app
// keeps working with no external requests at all.
import "@fontsource/archivo/400.css";
import "@fontsource/archivo/600.css";
import "@fontsource/archivo/800.css";
import "./theme.css";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./state";
import { ThemeProvider } from "./theme-context";
import NotebookHeader from "./components/notebook-header";
import CellList from "./components/cell-list";

const App = () => {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <NotebookHeader />
        <CellList />
      </ThemeProvider>
    </Provider>
  );
};

const container = document.querySelector("#root");
if (!container) {
  throw new Error("Root element #root not found");
}
createRoot(container).render(<App />);
