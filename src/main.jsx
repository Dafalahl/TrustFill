// main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import AppProviders from "./components/AppProviders";
import "@rainbow-me/rainbowkit/styles.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>
);
