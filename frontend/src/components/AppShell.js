import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

import { h } from "../utils/h";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { ToastHost } from "./ToastHost";
import { useNotificationStream } from "../hooks/useNotificationStream";

export function AppShell() {
  const location = useLocation();
  useNotificationStream();

  return h(
    "div",
    { className: "min-h-screen bg-[radial-gradient(90%_60%_at_50%_-10%,rgba(99,102,241,0.18),transparent_60%)] bg-gradient-to-b from-slate-50 via-indigo-50 to-cyan-50" },
    h(ToastHost),
    h(Header),
    h(
      "main",
      { className: "mx-auto w-full max-w-md px-4 pb-24 pt-4" },
      h(
        motion.div,
        {
          key: location.pathname,
          initial: { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: -10 },
          transition: { duration: 0.2 }
        },
        h(Outlet)
      )
    ),
    h(BottomNav)
  );
}