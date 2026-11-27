// @vitest-environment jsdom
import { expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import BridgeMaster from "../BridgeMaster.jsx";
it("lets a new player build, undo and test a bridge using accessible controls", () => {
  render(<BridgeMaster />);
  fireEvent.click(screen.getByRole("button", { name: "Qurishni boshlash" }));
  expect(screen.getByRole("button", { name: "Nuqta A" })).toHaveAttribute("aria-describedby", screen.getByRole("status").id);
  fireEvent.click(screen.getByRole("button", { name: "Nuqta A" }));
  expect(screen.getByRole("button", { name: "Nuqta B" })).toHaveAttribute("aria-describedby", screen.getByRole("status").id);
  fireEvent.click(screen.getByRole("button", { name: "Nuqta B" }));
  expect(screen.getByLabelText("Material sarfi")).toHaveTextContent("14 / 80");
  fireEvent.click(screen.getByRole("button", { name: "Ortga qaytarish" }));
  expect(screen.getByLabelText("Material sarfi")).toHaveTextContent("0 / 80");
  for (const [a, b] of [
    ["A", "B"],
    ["B", "C"],
    ["C", "D"],
    ["D", "E"],
  ]) {
    fireEvent.click(screen.getByRole("button", { name: `Nuqta ${a}` }));
    fireEvent.click(screen.getByRole("button", { name: `Nuqta ${b}` }));
  }
  expect(screen.getByRole("button", { name: "Ko‘prikni sinash" })).toHaveAttribute("aria-describedby", screen.getByRole("status").id);
  fireEvent.click(screen.getByRole("button", { name: "Ko‘prikni sinash" }));
  expect(
    screen.getByRole("button", { name: "Ortga qaytarish" }),
  ).toBeDisabled();
});
it("shows understandable invalid build feedback", () => {
  render(<BridgeMaster />);
  fireEvent.click(screen.getByRole("button", { name: "Qurishni boshlash" }));
  fireEvent.click(screen.getByRole("button", { name: "Nuqta A" }));
  fireEvent.click(screen.getByRole("button", { name: "Nuqta E" }));
  expect(screen.getByRole("status")).toHaveTextContent("juda uzun");
});
it("redo brings back an undone segment through the toolbar and Ctrl+Y", () => {
  render(<BridgeMaster config={{ onboarding: false }} />);
  fireEvent.click(screen.getByRole("button", { name: "Qurishni boshlash" }));
  const redo = () => screen.getByRole("button", { name: "Bekor qilingan qadamni qaytarish" });
  expect(redo()).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Nuqta A" }));
  fireEvent.click(screen.getByRole("button", { name: "Nuqta B" }));
  fireEvent.click(screen.getByRole("button", { name: "Ortga qaytarish" }));
  expect(screen.getByLabelText("Material sarfi")).toHaveTextContent("0 / 80");
  expect(redo()).toBeEnabled();
  fireEvent.click(redo());
  expect(screen.getByLabelText("Material sarfi")).toHaveTextContent("14 / 80");
  expect(redo()).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Ortga qaytarish" }));
  fireEvent.keyDown(screen.getByRole("main"), { key: "y", ctrlKey: true });
  expect(screen.getByLabelText("Material sarfi")).toHaveTextContent("14 / 80");
});
