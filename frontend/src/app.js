import React from "react";
import { RouterProvider } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import { h } from "./utils/h";
import { router } from "./router";
import { useBootstrapAuth } from "./store/authStore";

export function App() {
  const boot = useBootstrapAuth();

  if (!boot.ready) {
    return h(
      "div",
      { className: "min-h-screen px-4 py-6" },
      h("div", { className: "h-4 w-40 bg-neutral-200 rounded animate-pulse" }),
      h("div", { className: "mt-4 h-4 w-64 bg-neutral-200 rounded animate-pulse" }),
      h(
        "div",
        { className: "mt-10 space-y-3" },
        ...Array.from({ length: 6 }).map((_, i) =>
          h("div", { key: i, className: "h-10 bg-neutral-200 rounded animate-pulse" })
        )
      )
    );
  }

  return h(AnimatePresence, { mode: "wait" }, h(RouterProvider, { router }));
}
