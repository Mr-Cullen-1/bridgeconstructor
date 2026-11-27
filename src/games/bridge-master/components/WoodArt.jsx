// Small cartoon illustrations for the material counter: a stack of planks and a pile of logs.
// Pure SVG, no assets; sized by CSS through the `wood-art` class.
export function WoodPlanks({ className = "" }) {
  return (
    <svg className={`wood-art ${className}`} viewBox="0 0 44 36" aria-hidden="true" focusable="false">
      <g strokeLinejoin="round" strokeWidth="2" stroke="#7a4310">
        <path d="M3 22 26 12l15 6-23 10Z" fill="#c98542" />
        <path d="M3 22v5l15 6v-5Z" fill="#a8672a" />
        <path d="M18 28l23-10v5L18 33Z" fill="#8f531a" />
        <path d="M6 14 29 4l12 5-23 10Z" fill="#e6a65a" />
        <path d="M6 14v4l12 5v-4Z" fill="#c98542" />
      </g>
      <path d="M12 12 28 6m-14 9 16-7" stroke="#fff6" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function WoodLogs({ className = "" }) {
  const log = (x, y) => (
    <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
      <rect x="0" y="0" width="30" height="13" rx="3" fill="#a8672a" stroke="#6d3a0e" strokeWidth="2" />
      <ellipse cx="3" cy="6.5" rx="5.5" ry="6.5" fill="#f0c27a" stroke="#6d3a0e" strokeWidth="2" />
      <ellipse cx="3" cy="6.5" rx="2" ry="3" fill="none" stroke="#b9772f" strokeWidth="1.4" />
    </g>
  );
  return (
    <svg className={`wood-art ${className}`} viewBox="0 0 44 36" aria-hidden="true" focusable="false">
      {[log(2, 21), log(12, 21), log(7, 9), log(15, 9), log(11, 0)]}
    </svg>
  );
}
