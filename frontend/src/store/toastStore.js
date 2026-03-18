import { create } from "zustand";

function id() {
  return Math.random().toString(36).slice(2);
}

export const useToastStore = create((set) => ({
  toasts: [],
  push: ({ message, tone }) => {
    const toast = { id: id(), message, tone: tone || "info" };
    set((s) => ({ toasts: [toast].concat(s.toasts).slice(0, 3) }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== toast.id) }));
    }, 3500);
  },
  remove: (toastId) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== toastId) }))
}));