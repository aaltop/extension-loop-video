import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import "./global.css";
import Provider from "./contexts/Provider";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider>
      <App />
    </Provider>
  </React.StrictMode>,
);
