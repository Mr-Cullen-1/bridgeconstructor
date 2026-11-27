import { svg } from "../assets/design/index.js";

// One of the design pack's white line icons (icons/*.svg), as an image.
export default function PackIcon({ name, size = 24, className = "" }) {
  return <img className={`pk-icon ${className}`} src={svg(name)} width={size} height={size} alt="" draggable={false} />;
}
