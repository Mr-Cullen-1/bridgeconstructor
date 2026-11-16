// Local QA runner. LMS developers implement this host layer, not inside each game.
import React from "react";
import { createRoot } from "react-dom/client";
import Game, { bridgeMasterManifest } from "../../delivery/BridgeMaster.jsx";

window.addEventListener("message", function init(event) {
  if (event.source !== parent || event.origin !== location.origin ||
      event.data?.protocol !== "lms-game/v1" || event.data?.type !== "init" ||
      typeof event.data.channelId !== "string" || event.ports.length !== 1) return;
  window.removeEventListener("message", init);
  const port = event.ports[0];
  const send = (type, payload) => port.postMessage({
    protocol: "lms-game/v1", channelId: event.data.channelId,
    messageId: crypto.randomUUID(), type, payload,
  });
  window.addEventListener("error", (e) => send("error", { message: e.message }));
  window.addEventListener("unhandledrejection", (e) => send("error", { message: String(e.reason) }));
  send("ready", bridgeMasterManifest);
  createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <Game
        classLevel={5}
        lang="uz"
        onFinished={(result) => send("completed", result)}
        onExit={(metadata) => send("exited", metadata)}
        config={{ onEvent: (data) => send("event", data) }}
      />
    </React.StrictMode>,
  );
});
