import React from "react";
import { h } from "../../utils/h";

export function Input({ className, ...props }) {
  return h("input", {
    ...props,
    className: [
      "w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm",
      "outline-none focus:border-neutral-400",
      className || ""
    ].join(" ")
  });
}
