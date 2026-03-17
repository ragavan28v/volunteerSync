import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

import { h } from "../utils/h";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";

export function AppShell() {
  const location = useLocation();

  return h(
    "div",
    { className: "min-h-screen" },
    h(Header),
    h(
      "main",
      { className: "mx-auto w-full max-w-md px-4 pb-20 pt-4" },
      h(
        motion.div,
        {
          key: location.pathname,
          initial: { opacity: 0, y: 6 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: -6 },
          transition: { duration: 0.18 }
        },
        h(Outlet)
      )
    ),
    h(BottomNav)
  );
}
