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
  const base = "inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium";
  const variants = {
    primary: "bg-neutral-900 text-white active:bg-neutral-800",
    ghost: "text-neutral-900 active:bg-neutral-100",
    subtle: "bg-neutral-100 text-neutral-900 active:bg-neutral-200",
    danger: "bg-red-600 text-white active:bg-red-700"
  };

  return h(
    motion.button,
    {
      type,
      disabled,
      onClick,
      whileTap: disabled ? undefined : { scale: 0.98 },
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
