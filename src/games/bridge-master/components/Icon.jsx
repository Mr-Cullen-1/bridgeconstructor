const paths = {
  bridge: "M3 17h18M4 17V7m16 10V7M4 9c5 7 11 7 16 0M8 13v4m4-2v2m4-4v4",
  road: "M3 8h18M3 16h18M6 12h2m4 0h2m4 0h2",
  support: "M3 19 12 4l9 15H3Zm9-15v15",
  undo: "M9 5 4 10l5 5M4 10h10a6 6 0 0 1 0 12",
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
      <path d={paths[name] ?? paths.bridge} />
    </svg>
  );
}
