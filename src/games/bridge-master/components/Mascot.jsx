import { img, sizeOf } from "../assets/design/index.js";

// The Junior robot in one of the pack's poses: wave, point, think, explain, success, retry, idle.
// The sprite is trimmed, so only the height needs to be given (by CSS or `height`).
export default function Mascot({ pose = "idle", height, className = "" }) {
  const { w, h } = sizeOf(`mascot-${pose}`);
  return (
    <img
      key={pose}
      className={`mascot ${className}`}
      src={img(`mascot-${pose}`)}
      width={height ? Math.round((height * w) / h) : undefined}
      height={height}
      alt=""
      draggable={false}
    />
  );
}
