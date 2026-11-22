import { useEffect, useMemo, useRef } from "react";
import BridgeMaster from "../games/bridge-master/BridgeMaster.jsx";
import styles from "../games/bridge-master/styles/bridge-master.css?inline";
import { normalizeLang } from "../games/bridge-master/i18n/index.js";

// GameLab contract v1 entry (props from §5). The game itself is `BridgeMaster`; this file only maps
// host props onto it. The manifest is appended by `npm run export:gamelab`.
export default function Game({
  context,
  lang,
  progress,
  saveState,
  onAttemptStart,
  onAttemptEnd,
  onRetrySave,
  onExit,
  onEvent,
}) {
  // Always call the newest host callbacks, never a stale closure.
  const host = useRef({});
  useEffect(() => {
    host.current = { onAttemptStart, onAttemptEnd, onRetrySave, onExit, onEvent };
  });
  const config = useMemo(
    () => ({
      edgeEvents: false,
      onEvent: (event) =>
        host.current.onEvent?.({
          name: event.name,
          data: { levelId: event.levelId, attemptNumber: event.attemptNumber },
        }),
    }),
    [],
  );
  return (
    <>
      <style>{styles}</style>
      <BridgeMaster
        classLevel={Number.isInteger(context?.classLevel) ? context.classLevel : undefined}
        lang={normalizeLang(lang)}
        config={config}
        progress={progress}
        saveState={saveState}
        onAttemptStart={(payload) => host.current.onAttemptStart?.(payload)}
        onAttemptEnd={(result) => host.current.onAttemptEnd?.(result)}
        onRetrySave={(attemptId) => host.current.onRetrySave?.(attemptId)}
        onExit={() => host.current.onExit?.()}
      />
    </>
  );
}
