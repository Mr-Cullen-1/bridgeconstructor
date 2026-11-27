import { useEffect, useRef } from "react";
// `custom` lets a dialog supply its own heading layout; focus trap and dialog semantics stay shared.
export default function Modal({ title, children, className = "", eyebrow, custom = false, style, backdropClassName = "", sectionRef }) {
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
    <div className={`modal-backdrop ${backdropClassName}`}>
      <section
        ref={(node) => {
          ref.current = node;
          if (sectionRef) sectionRef.current = node;
        }}
        style={style}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`modal ${className}`}
        onKeyDown={trap}
      >
        {!custom && eyebrow && <span className="modal-eyebrow">{eyebrow}</span>}
        {!custom && <h2>{title}</h2>}
        {children}
      </section>
    </div>
  );
}
