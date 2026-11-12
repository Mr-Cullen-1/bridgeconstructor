export default function Vehicle({ pose }) {
  return (
    <g
      transform={`translate(${pose.x} ${pose.y - 5}) rotate(${pose.angle ?? 0})`}
      aria-hidden="true"
    >
      <ellipse cx="0" cy="2" rx="25" ry="5" fill="#153e3f" opacity=".12" />
      <path
        d="M-25-12v-13q0-4 4-4h21l11 12h10q4 0 4 4v10h-50Z"
        fill="#f0ab46"
        stroke="#b97c28"
        strokeWidth="1.5"
      />
      <path d="M-17-25h15l9 10h-24Z" fill="#e0f5f0" />
      <path d="M-5-25v10" stroke="#c9882a" strokeWidth="2" />
      <path d="M-24-7h49" stroke="#ffe3a4" strokeWidth="3" />
      {[-15, 16].map((x) => (
        <g key={x}>
          <circle cx={x} cy="-2" r="7" fill="#263e40" />
          <circle cx={x} cy="-2" r="3" fill="#f4f1df" />
        </g>
      ))}
      <rect x="21" y="-13" width="5" height="5" rx="1" fill="#fff0b7" />
    </g>
  );
}
