import { useMemo } from "react";
import BridgeMaster from "./games/bridge-master/BridgeMaster.jsx";

// The standalone app remembers which guided lessons the player already saw, as a JSON list of lesson
// ids in localStorage ("*" means all of them). The game component itself never touches browser
// storage (the GameLab export forbids it), so the memory lives in this host layer.
// `?tour` shows every lesson again, for demos.
const KEY = "bridge-master:onboarding:v2";
const read = () => {
  try {
    const list = JSON.parse(localStorage.getItem(KEY));
    return Array.isArray(list) ? list.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
};
const write = (list) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* Private mode: the lessons simply show again next time. */
  }
};
export default function App() {
  const config = useMemo(
    () => ({
      onboardingSeen: new URLSearchParams(location.search).has("tour") ? [] : read(),
      onOnboardingDone: (id) => write([...new Set([...read(), id])]),
    }),
    [],
  );
  return <BridgeMaster config={config} />;
}
