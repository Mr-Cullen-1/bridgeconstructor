const road = [
  ["a", "b"],
  ["b", "c"],
  ["c", "d"],
  ["d", "e"],
];
const supports = ["a", "b", "c", "d", "e"].map((id) => [id, "f", "support"]);
export const solutions = [
  road,
  [
    ["a", "b"],
    ["b", "e"],
    ["a", "f", "support"],
    ["b", "f", "support"],
    ["e", "f", "support"],
  ],
  [...road, ...supports],
  [
    ["a", "c"],
    ["c", "e"],
    ["a", "f", "support"],
    ["c", "f", "support"],
    ["e", "f", "support"],
  ],
  [...road, ...supports],
];
