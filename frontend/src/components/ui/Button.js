import React from "react";
import { motion } from "framer-motion";

import { h } from "../../utils/h";

export function Button({
  children,
  variant = "primary",
  type = "button",
  disabled,
  onClick,
  className
}) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold";
  const variants = {
    primary:
      "bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-sm active:opacity-95",
    subtle:
      "bg-white/70 text-neutral-900 shadow-sm backdrop-blur active:bg-white",
    ghost: "text-neutral-900 active:bg-white/60",
    danger:
      "bg-gradient-to-r from-rose-600 to-amber-500 text-white shadow-sm active:opacity-95"
  };

  return h(
    motion.button,
    {
      type,
      disabled,
      onClick,
      whileTap: disabled ? undefined : { scale: 0.96 },
      className: [
        base,
        variants[variant] || variants.primary,
        disabled ? "opacity-50" : "",
        className || ""
      ].join(" ")
    },
    children
  );
}