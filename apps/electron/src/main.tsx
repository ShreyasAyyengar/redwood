import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "@fullstack-template/shad-ui/globals.css";
import Providers from "./app/_components/providers.tsx";

// biome-ignore lint/style/noNonNullAssertion: root element exists
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Providers>
      <App />
    </Providers>
  </React.StrictMode>
);

// Use contextBridge
window.ipcRenderer.on("main-process-message", (_event, message) => {
  console.log(message);
});
