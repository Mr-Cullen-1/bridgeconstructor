// @vitest-environment jsdom
import { expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import LevelSelect from "../components/LevelSelect.jsx";
import { uz } from "../i18n/uz.js";

const levels = Array.from({ length: 20 }, (_, index) => ({
  id: `level-${index + 1}`, title: `Ko‘prik ${index + 1}`, subtitle: "Qurib ko‘ring",
}));

it("opens the current page and selects the twentieth level without losing earned stars", () => {
  const onSelect = vi.fn();
  render(<LevelSelect levels={levels} t={uz} currentLevelId="level-18"
    scores={{ "level-20": 3 }} onSelect={onSelect} onClose={() => {}} />);
  expect(screen.queryByRole("button", { name: "1-bosqich: Ko‘prik 1" })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "18-bosqich: Ko‘prik 18" })).toHaveTextContent("Hozirgi");
  expect(screen.getByLabelText("3 yulduz")).toBeVisible();
  expect(screen.getByRole("button", { name: "Keyingi sahifa" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "20-bosqich: Ko‘prik 20" }));
  expect(onSelect).toHaveBeenCalledWith(levels[19]);
  fireEvent.click(screen.getByRole("button", { name: "Oldingi sahifa" }));
  expect(screen.getByRole("button", { name: "11-bosqich: Ko‘prik 11" })).toBeVisible();
  expect(screen.queryByRole("button", { name: "20-bosqich: Ko‘prik 20" })).not.toBeInTheDocument();
});

it("visits every page, preserves Close and prevents going past the first page", () => {
  const onClose = vi.fn();
  render(<LevelSelect levels={levels} t={uz} currentLevelId="level-1"
    scores={{}} onSelect={() => {}} onClose={onClose} />);
  expect(screen.getByRole("button", { name: "Oldingi sahifa" })).toBeDisabled();
  for (const first of [6, 11, 16]) {
    fireEvent.click(screen.getByRole("button", { name: "Keyingi sahifa" }));
    expect(screen.getByRole("button", { name: `${first}-bosqich: Ko‘prik ${first}` })).toBeVisible();
  }
  fireEvent.click(screen.getByRole("button", { name: "Yopish" }));
  expect(onClose).toHaveBeenCalledOnce();
});
