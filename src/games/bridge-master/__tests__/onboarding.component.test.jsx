// @vitest-environment jsdom
import { beforeEach, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import BridgeMaster from "../BridgeMaster.jsx";
import { resetOnboardingMemory } from "../hooks/useOnboarding.js";

// jsdom has no layout, so the card is never positioned (opacity 0); its text is still queryable.
const card = () => screen.queryByLabelText("O‘yin bo‘yicha qo‘llanma", { selector: "section" });
const shows = (text) => expect(card()).toHaveTextContent(text);
const start = () => fireEvent.click(screen.getByRole("button", { name: "Qurishni boshlash" }));
const gotIt = () => fireEvent.click(screen.getByRole("button", { name: "Tushunarli" }));
const node = (id) => fireEvent.click(screen.getByRole("button", { name: `Nuqta ${id}` }));
const link = (a, b) => {
  node(a);
  node(b);
};
const tool = (name) => fireEvent.click(screen.getByRole("button", { name, exact: true }));
const slow = { timeout: 3000 };
const goToLevel = (n, title) => {
  fireEvent.click(screen.getAllByRole("button", { name: "Bosqichlar" })[0]);
  fireEvent.click(screen.getByRole("button", { name: `${n}-bosqich: ${title}` }));
  start();
};
const seenFirst = { onboardingSeen: ["bridge-01"] };

beforeEach(() => resetOnboardingMemory());

it("opens the tour once building starts for a brand-new player", () => {
  render(<BridgeMaster />);
  expect(card()).toBeNull();
  start();
  shows("1 / 10");
  shows("Ko‘prik quramiz!");
});

it("teaches level one in full: it names what to press and waits until the player does it", async () => {
  const onDone = vi.fn();
  render(<BridgeMaster config={{ onOnboardingDone: onDone }} />);
  start();
  for (const heading of ["Ko‘prik quramiz!", "Bu — bosqich", "Material — sizning hamyoningiz", "Ikkita asbob"]) {
    shows(heading);
    gotIt();
  }
  shows("1-qadam: A nuqta");
  shows("A nuqtani bosing"); // the button is named, never just "the highlighted spot"
  expect(screen.queryByRole("button", { name: "Tushunarli" })).toBeNull();
  node("A");
  await waitFor(() => shows("B nuqtani bosing"), slow);
  node("B");
  await waitFor(() => shows("Adashdingizmi?"), slow);
  gotIt();
  shows("B–C, C–D va D–E ni ulang");
  for (const [a, b] of [["B", "C"], ["C", "D"], ["D", "E"]]) link(a, b);
  await waitFor(() => shows("Ovoz va tanaffus"), slow);
  gotIt();
  shows("«Ko‘prikni sinash» tugmasini bosing");
  expect(onDone).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Ko‘prikni sinash" }));
  await waitFor(() => expect(card()).toBeNull(), slow);
  expect(onDone).toHaveBeenCalledWith("bridge-01");
});

it("teaches level two: the F support, the Support tool, the three ropes and the triangles", async () => {
  const onDone = vi.fn();
  render(<BridgeMaster config={{ ...seenFirst, onOnboardingDone: onDone }} />);
  expect(card()).toBeNull();
  goToLevel(2, "Tayanch kuchi");
  shows("Yangi: tayanch nuqta!");
  shows("1 / 6");
  gotIt();
  shows("A–B va B–E ni ulang");
  link("A", "B");
  link("B", "E");
  await waitFor(() => shows("«Tayanch» tugmasini bosing"), slow);
  tool("Tayanch");
  await waitFor(() => shows("F–A, F–B va F–E ni ulang"), slow);
  link("F", "A");
  link("F", "B");
  link("F", "E");
  await waitFor(() => shows("Uchburchaklar!"), slow);
  gotIt();
  shows("«Ko‘prikni sinash» tugmasini bosing");
  fireEvent.click(screen.getByRole("button", { name: "Ko‘prikni sinash" }));
  await waitFor(() => expect(card()).toBeNull(), slow);
  expect(onDone).toHaveBeenCalledWith("bridge-02");
});

it("steps back to the Support tool if the player returns to the Road tool", async () => {
  render(<BridgeMaster config={seenFirst} />);
  goToLevel(2, "Tayanch kuchi");
  gotIt();
  link("A", "B");
  link("B", "E");
  await waitFor(() => shows("«Tayanch» tugmasini bosing"), slow);
  tool("Tayanch");
  await waitFor(() => shows("F–A, F–B va F–E ni ulang"), slow);
  tool("Yo‘l");
  await waitFor(() => shows("«Tayanch» tugmasini bosing"), slow);
});

it("teaches level three: a triangle under every piece of road", async () => {
  render(<BridgeMaster config={seenFirst} />);
  goToLevel(3, "Uchburchak siri");
  shows("Uchburchak siri");
  gotIt();
  shows("Yo‘lni A dan E gacha ulang");
  for (const [a, b] of [["A", "B"], ["B", "C"], ["C", "D"], ["D", "E"]]) link(a, b);
  await waitFor(() => shows("«Tayanch» tugmasini bosing"), slow);
  tool("Tayanch");
  await waitFor(() => shows("F ni A, B, C, D va E bilan ulang"), slow);
  for (const id of ["A", "B", "C", "D", "E"]) link("F", id);
  await waitFor(() => shows("To‘rtta uchburchak!"), slow);
  gotIt();
  shows("Tejamkor bo‘ling");
});

it("gives a short NEW note, once, on a level that changes something", () => {
  render(<BridgeMaster config={{ onboardingSeen: ["bridge-01", "bridge-02", "bridge-03"] }} />);
  goToLevel(4, "Oqilona quruvchi");
  shows("YANGI!");
  shows("Material kam!");
  expect(card()).not.toHaveTextContent(/\d \/ \d/);
});

it("stays quiet on a level with nothing new", () => {
  render(<BridgeMaster config={seenFirst} />);
  goToLevel(5, "Yangi cho‘qqilar");
  expect(card()).toBeNull();
});

it("can be skipped at any step: that silences every lesson and tells the host", () => {
  const onDone = vi.fn();
  const first = render(<BridgeMaster config={{ onOnboardingDone: onDone }} />);
  start();
  gotIt();
  fireEvent.click(screen.getByRole("button", { name: "O‘tkazib yuborish" }));
  expect(card()).toBeNull();
  expect(onDone).toHaveBeenCalledWith("*");
  first.unmount();
  render(<BridgeMaster />);
  start();
  expect(card()).toBeNull();
  goToLevel(2, "Tayanch kuchi");
  expect(card()).toBeNull();
});

it("stays away when the host turns it off or the player already finished that level", () => {
  const off = render(<BridgeMaster config={{ onboarding: false }} />);
  start();
  expect(card()).toBeNull();
  off.unmount();
  render(<BridgeMaster progress={{ completedLevelIds: ["bridge-01"], scopes: [] }} />);
  start();
  expect(card()).toBeNull();
});

it("speaks the player's language", () => {
  render(<BridgeMaster lang="en" />);
  fireEvent.click(screen.getByRole("button", { name: "Start building" }));
  expect(screen.getByLabelText("Game tutorial", { selector: "section" })).toHaveTextContent("Let’s build a bridge!");
});

it("ends the tour as soon as the player finds the Test button on their own", async () => {
  render(<BridgeMaster />);
  start();
  fireEvent.click(screen.getByRole("button", { name: "Ko‘prikni sinash" }));
  await waitFor(() => expect(card()).toBeNull(), slow);
});
