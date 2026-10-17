import { describe, it, expect, vi } from "vitest";
import {
  commandPaletteStore,
  openCommandPalette,
  closeCommandPalette,
  toggleCommandPalette,
  subscribeToCommandPalette,
} from "@/lib/command-palette";

describe("Command Palette Store", () => {
  it("defaults to closed state", () => {
    closeCommandPalette();
    expect(commandPaletteStore.getIsOpen()).toBe(false);
  });

  it("opens palette and notifies subscribers with query", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToCommandPalette(listener);

    openCommandPalette("fx-991");
    expect(commandPaletteStore.getIsOpen()).toBe(true);
    expect(listener).toHaveBeenCalledWith(true, "fx-991");

    unsubscribe();
  });

  it("closes palette and notifies subscribers", () => {
    const listener = vi.fn();
    openCommandPalette();
    const unsubscribe = subscribeToCommandPalette(listener);

    closeCommandPalette();
    expect(commandPaletteStore.getIsOpen()).toBe(false);
    expect(listener).toHaveBeenCalledWith(false);

    unsubscribe();
  });

  it("toggles state back and forth", () => {
    closeCommandPalette();
    expect(commandPaletteStore.getIsOpen()).toBe(false);

    toggleCommandPalette();
    expect(commandPaletteStore.getIsOpen()).toBe(true);

    toggleCommandPalette();
    expect(commandPaletteStore.getIsOpen()).toBe(false);
  });

  it("cleanly unsubscribes listeners", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToCommandPalette(listener);

    openCommandPalette();
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    closeCommandPalette();
    // Listener should not have been called for close after unsubscribing
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
