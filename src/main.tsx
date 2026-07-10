import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./app/App";
import "./shared/styles/global.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

function reloadOnceAfterChunkError() {
  const reloadKey = "spot:chunk-reload-attempted";

  if (sessionStorage.getItem(reloadKey)) {
    return;
  }

  sessionStorage.setItem(reloadKey, "true");
  window.location.reload();
}

window.addEventListener("unhandledrejection", (event) => {
  const reason = event.reason;
  const message =
    reason instanceof Error ? reason.message : String(reason ?? "");

  if (
    message.includes("Failed to fetch dynamically imported module") ||
    message.includes("Importing a module script failed")
  ) {
    reloadOnceAfterChunkError();
  }
});

window.setTimeout(() => {
  sessionStorage.removeItem("spot:chunk-reload-attempted");
}, 30000);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        registration.addEventListener("updatefound", () => {
          const installingWorker = registration.installing;

          installingWorker?.addEventListener("statechange", () => {
            if (
              installingWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              installingWorker.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });
      })
      .catch(() => {
        // PWA support should never block the app shell.
      });
  });
}
