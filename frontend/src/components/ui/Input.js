import React from "react";
import { h } from "../../utils/h";

export function Input({ className, ...props }) {
  return h("input", {
    ...props,
    className: [
      "w-full rounded-xl border border-white/60 bg-white/80 px-3 py-2 text-sm",
      "shadow-sm backdrop-blur outline-none focus:border-slate-300",
      className || ""
    ].join(" ")
  });
}