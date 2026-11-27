export function useGameInput({ dispatch }) {
  return {
    onKeyDown(event) {
      if (
        event.target.closest('input,textarea,select,[contenteditable="true"]')
      )
        return;
      const mod = event.ctrlKey || event.metaKey;
      if (mod && event.key.toLowerCase() === "z" && !event.shiftKey) {
        event.preventDefault();
        dispatch({ type: "UNDO" });
      }
      if (mod && (event.key.toLowerCase() === "y" || (event.key.toLowerCase() === "z" && event.shiftKey))) {
        event.preventDefault();
        dispatch({ type: "REDO" });
      }
      if (event.key === "Escape") dispatch({ type: "CANCEL_SELECTION" });
      if (["Delete", "Backspace"].includes(event.key)) {
        event.preventDefault();
        // The selected SVG element is about to unmount; keep shortcuts in the game.
        event.currentTarget.focus({ preventScroll: true });
        dispatch({ type: "REMOVE_EDGE" });
      }
    },
  };
}
