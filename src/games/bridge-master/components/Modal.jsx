import { useEffect, useRef } from "react";
export default function Modal({ title, children, className = "", eyebrow }) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    ref.current?.querySelector("button")?.focus();
    return () => previous?.focus?.();
  }, []);
  function trap(e) {
    if (e.key !== "Tab") return;
    const buttons = [
      ...ref.current.querySelectorAll('button:not(:disabled),[tabindex="0"]'),
    ];
    if (!buttons.length) return;
    if (e.shiftKey && document.activeElement === buttons[0]) {
      e.preventDefault();
      buttons.at(-1).focus();
    } else if (!e.shiftKey && document.activeElement === buttons.at(-1)) {
      e.preventDefault();
      buttons[0].focus();
    }
  }
  return (
    <div className="modal-backdrop">
      <section
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`modal ${className}`}
        onKeyDown={trap}
      >
        {eyebrow && <span className="modal-eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
        {children}
      </section>
    </div>
  );
}
