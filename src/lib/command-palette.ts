"use client";

type CommandPaletteListener = (isOpen: boolean, initialQuery?: string) => void;

class CommandPaletteStore {
  private isOpen = false;
  private listeners: Set<CommandPaletteListener> = new Set();

  public subscribe(listener: CommandPaletteListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public open(initialQuery: string = "") {
    this.isOpen = true;
    for (const listener of this.listeners) {
      listener(true, initialQuery);
    }
  }

  public close() {
    this.isOpen = false;
    for (const listener of this.listeners) {
      listener(false);
    }
  }

  public toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  public getIsOpen(): boolean {
    return this.isOpen;
  }
}

export const commandPaletteStore = new CommandPaletteStore();

export function openCommandPalette(query: string = "") {
  commandPaletteStore.open(query);
}

export function closeCommandPalette() {
  commandPaletteStore.close();
}

export function toggleCommandPalette() {
  commandPaletteStore.toggle();
}

export function subscribeToCommandPalette(listener: CommandPaletteListener) {
  return commandPaletteStore.subscribe(listener);
}
