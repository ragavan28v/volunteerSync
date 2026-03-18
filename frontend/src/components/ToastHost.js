import React from "react";
import { AnimatePresence, motion } from "framer-motion";

import { h } from "../utils/h";
import { useToastStore } from "../store/toastStore";

function Toast({ t, onClose }) {
  const tone =
    t.tone === "success"
      ? "from-emerald-500/15 to-cyan-500/10"
      : t.tone === "error"
        ? "from-rose-500/15 to-amber-400/10"
        : "from-indigo-500/15 to-cyan-500/10";

  return h(
    motion.button,
    {
      type: "button",
      onClick: onClose,
      initial: { opacity: 0, y: -6, scale: 0.98 },
      animate: { opacity: 1, y: 0, scale: 1 },
      exit: { opacity: 0, y: -8, scale: 0.98 },
      transition: { duration: 0.18 },
      className: [
        "w-full rounded-2xl border border-white/50 bg-gradient-to-b px-4 py-3 text-left",
        "shadow-sm backdrop-blur",
        tone
      ].join(" ")
    },
    h("div", { className: "text-sm text-neutral-900" }, t.message)
  );
}

export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);
  const remove = useToastStore((s) => s.remove);

  return h(
    "div",
    { className: "pointer-events-none fixed left-0 right-0 top-2 z-50 px-3" },
    h(
      "div",
      { className: "mx-auto max-w-md space-y-2" },
      h(
        AnimatePresence,
        { initial: false },
        ...toasts.map((t) =>
          h(
            "div",
            { key: t.id, className: "pointer-events-auto" },
            h(Toast, { t, onClose: () => remove(t.id) })
          )
        )
      )
    )
  );
}