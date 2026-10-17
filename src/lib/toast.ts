"use client";

import { create } from "zustand";

export type ToastType = "default" | "success" | "error" | "info";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
  duration?: number;
}

interface ToastStore {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, "id">) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).slice(2, 9);
    const newToast: ToastItem = { ...toast, id };

    set((state) => ({
      toasts: [...state.toasts.slice(-4), newToast], // Keep at most 5 toasts visible
    }));

    const duration = toast.duration ?? 3500;
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }

    return id;
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
  clearToasts: () => set({ toasts: [] }),
}));

export const toast = {
  success: (title: string, options?: { description?: string; duration?: number }) => {
    return useToastStore.getState().addToast({
      title,
      description: options?.description,
      duration: options?.duration,
      type: "success",
    });
  },
  error: (title: string, options?: { description?: string; duration?: number }) => {
    return useToastStore.getState().addToast({
      title,
      description: options?.description,
      duration: options?.duration,
      type: "error",
    });
  },
  info: (title: string, options?: { description?: string; duration?: number }) => {
    return useToastStore.getState().addToast({
      title,
      description: options?.description,
      duration: options?.duration,
      type: "info",
    });
  },
  default: (title: string, options?: { description?: string; duration?: number }) => {
    return useToastStore.getState().addToast({
      title,
      description: options?.description,
      duration: options?.duration,
      type: "default",
    });
  },
  dismiss: (id: string) => {
    useToastStore.getState().removeToast(id);
  },
};
