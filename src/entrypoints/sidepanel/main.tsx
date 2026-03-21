import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import "./style.css";
import SavedStateProvider from "./SavedStateProvider";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <SavedStateProvider>
      <App />
    </SavedStateProvider>
  </React.StrictMode>,
);
