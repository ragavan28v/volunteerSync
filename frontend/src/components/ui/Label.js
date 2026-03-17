import React from "react";
import { h } from "../../utils/h";

export function Label({ children }) {
  return h("div", { className: "text-xs font-medium text-neutral-600" }, children);
}
