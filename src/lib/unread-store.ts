"use client";

type Listener = (count: number) => void;

class UnreadStore {
  private count: number = 0;
  private listeners: Set<Listener> = new Set();
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private inFlightPromise: Promise<number> | null = null;
  private isPollingActive: boolean = false;
  private abortController: AbortController | null = null;
  private readonly pollIntervalMs: number = 30_000;

  constructor() {
    if (typeof window !== "undefined") {
      document.addEventListener("visibilitychange", this.handleVisibilityChange);
    }
  }

  private handleVisibilityChange = () => {
    if (document.hidden) {
      this.stopPollingTimer();
    } else {
      if (this.listeners.size > 0) {
        this.fetchCount();
        this.startPollingTimer();
      }
    }
  };

  private startPollingTimer() {
    if (this.intervalId || typeof window === "undefined") return;
    this.intervalId = setInterval(() => {
      if (!document.hidden && this.listeners.size > 0) {
        this.fetchCount();
      }
    }, this.pollIntervalMs);
  }

  private stopPollingTimer() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public async fetchCount(): Promise<number> {
    if (this.inFlightPromise) {
      return this.inFlightPromise;
    }

    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();

    this.inFlightPromise = (async () => {
      try {
        const res = await fetch("/api/messages/unread-count", {
          signal: this.abortController?.signal,
          headers: { "Cache-Control": "no-cache" },
        });

        if (!res.ok) {
          return this.count;
        }

        const data = await res.json();
        const newCount = typeof data.count === "number" ? data.count : 0;
        
        if (newCount !== this.count) {
          this.count = newCount;
          this.notify();
        }
        return this.count;
      } catch {
        // Network error / aborted
        return this.count;
      } finally {
        this.inFlightPromise = null;
      }
    })();

    return this.inFlightPromise;
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    // Immediately inform listener of current known count
    listener(this.count);

    if (this.listeners.size === 1) {
      this.fetchCount();
      this.startPollingTimer();
    }

    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) {
        this.stopPollingTimer();
        if (this.abortController) {
          this.abortController.abort();
          this.abortController = null;
        }
      }
    };
  }

  public setCount(newCount: number) {
    if (this.count !== newCount) {
      this.count = newCount;
      this.notify();
    }
  }

  public decrement() {
    if (this.count > 0) {
      this.count--;
      this.notify();
    }
  }

  public getCount(): number {
    return this.count;
  }

  private notify() {
    for (const listener of this.listeners) {
      listener(this.count);
    }
  }
}

export const unreadStore = new UnreadStore();

export function subscribeToUnreadCount(listener: Listener): () => void {
  return unreadStore.subscribe(listener);
}

export function refreshUnreadCount(): Promise<number> {
  return unreadStore.fetchCount();
}

export function setUnreadCount(count: number) {
  unreadStore.setCount(count);
}
