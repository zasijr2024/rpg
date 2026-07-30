import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./ui/App";
import { SessionErrorBoundary } from "./ui/SessionErrorBoundary";
import "./ui/styles/global.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <SessionErrorBoundary>
      <App />
    </SessionErrorBoundary>
  </React.StrictMode>,
);
