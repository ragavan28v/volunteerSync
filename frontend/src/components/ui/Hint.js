import React from "react";
import { h } from "../../utils/h";

export function Hint({ children }) {
  return h("div", { className: "text-xs text-neutral-500" }, children);
}
