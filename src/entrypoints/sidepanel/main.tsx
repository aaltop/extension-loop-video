import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import "./global.css";
import { SavedStateProvider } from "./SavedStateContext";
import ConsoleContextProvider from "./ConsoleContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <SavedStateProvider>
      <ConsoleContextProvider>
        <App />
      </ConsoleContextProvider>
    </SavedStateProvider>
  </React.StrictMode>,
);
