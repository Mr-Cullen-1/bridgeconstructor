const paths = {
  bridge: "M3 17h18M4 17V7m16 10V7M4 9c5 7 11 7 16 0M8 13v4m4-2v2m4-4v4",
  road: "M3 8h18M3 16h18M6 12h2m4 0h2m4 0h2",
  support: "M3 19 12 4l9 15H3Zm9-15v15",
  undo: "M9 5 4 10l5 5M4 10h10a6 6 0 0 1 0 12",
  redo: "m15 5 5 5-5 5M20 10H10a6 6 0 0 0 0 12",
  trash: "M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7",
  reset: "M4 10a8 8 0 1 1 1 9M4 4v6h6",
  play: "m8 4 12 8-12 8V4Z",
  pause: "M8 4v16M16 4v16",
  sound: "M11 4 6 8H3v8h3l5 4V4Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14",
  muted: "M11 4 6 8H3v8h3l5 4V4Zm5 5 5 6m0-6-5 6",
  arrow: "M4 12h16m-6-6 6 6-6 6",
  grid: "M3 3h6v6H3V3Zm12 0h6v6h-6V3ZM3 15h6v6H3v-6Zm12 0h6v6h-6v-6Z",
  check: "m5 12 4 4L19 6",
  close: "m6 6 12 12M6 18 18 6",
  bulb: "M9 18h6m-6 3h6M8 15c-6-8 3-15 8-9 3 4 0 7-1 9H8Z",
  star: "m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6Z",
  flag: "M5 22V3m0 0h13l-3 4 3 4H5",
  back: "M20 12H5m6-6-6 6 6 6",
  gamepad: "M7 8h10a5 5 0 0 1 4.9 4l.6 3.6A2.6 2.6 0 0 1 18 18.2L16 16H8l-2 2.2a2.6 2.6 0 0 1-4.5-2.6l.6-3.6A5 5 0 0 1 7 8Zm.5 3v4M5.5 13h4m6.5-1h.01m2 2h.01",
  layers: "M12 3 3 8l9 5 9-5-9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5",
  nodes: "M3 12a2.6 2.6 0 1 0 5.2 0A2.6 2.6 0 0 0 3 12Zm12.8 0a2.6 2.6 0 1 0 5.2 0 2.6 2.6 0 0 0-5.2 0ZM8.2 12h7.6",
  cheer: "M4 7l3 3M12 3v4.5M20 7l-3 3",
  wrench: "M14.7 6.3a4 4 0 0 0-5.2 5.2L3 18l3 3 6.5-6.5a4 4 0 0 0 5.2-5.2l-2.6 2.6-2.4-.6-.6-2.4 2.6-2.6Z",
  // Solid variants: closed shapes are filled, the rest stays a stroke.
  soundSolid: [{ d: "M3 9v6h4l5 4V5L7 9H3Z", solid: true }, { d: "M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" }],
  mutedSolid: [{ d: "M3 9v6h4l5 4V5L7 9H3Z", solid: true }, { d: "m16 9 5 6m0-6-5 6" }],
  pauseSolid: [{ d: "M6.5 4h3.5v16H6.5zM14 4h3.5v16H14z", solid: true }],
  playSolid: [{ d: "M7 4.5v15l12.5-7.5L7 4.5Z", solid: true }],
};
export default function Icon({ name, size = 20, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {[].concat(paths[name] ?? paths.bridge).map((part, i) =>
        typeof part === "string" ? (
          <path key={i} d={part} />
        ) : (
          <path key={i} d={part.d} fill={part.solid ? "currentColor" : "none"} />
        ),
      )}
    </svg>
  );
}
