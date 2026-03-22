import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import "./style.css";
import SavedStateProvider from "./SavedStateProvider";
import ConsoleContextProvider from "./ConsoleProvider";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <SavedStateProvider>
      <ConsoleContextProvider>
        <App />
      </ConsoleContextProvider>
    </SavedStateProvider>
  </React.StrictMode>,
);
