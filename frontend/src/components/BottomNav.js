import React from "react";
import { NavLink } from "react-router-dom";

import { h } from "../utils/h";

function Tab({ to, label, icon }) {
  return h(
    NavLink,
    {
      to,
      className: ({ isActive }) =>
        [
          "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs",
          isActive ? "text-neutral-900" : "text-neutral-500"
        ].join(" ")
    },
    h("div", { className: "h-5 w-5" }, icon),
    h("div", null, label)
  );
}

function Icon({ d }) {
  return h(
    "svg",
    { viewBox: "0 0 24 24", fill: "none", className: "h-5 w-5" },
    h("path", {
      d,
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round"
    })
  );
}

export function BottomNav() {
  return h(
    "nav",
    { className: "fixed bottom-0 left-0 right-0 z-20 border-t border-neutral-200 bg-white" },
    h(
      "div",
      { className: "mx-auto grid max-w-md grid-cols-4" },
      h(Tab, {
        to: "/app",
        label: "Home",
        icon: h(Icon, { d: "M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" })
      }),
      h(Tab, {
        to: "/app/events",
        label: "Events",
        icon: h(Icon, { d: "M8 7V4m8 3V4M5 10h14M6 20h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2Z" })
      }),
      h(Tab, {
        to: "/app/assignments",
        label: "Assignments",
        icon: h(Icon, { d: "M9 12h6M9 16h6M7 20h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H9l-2 2H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2Z" })
      }),
      h(Tab, {
        to: "/app/profile",
        label: "Profile",
        icon: h(Icon, { d: "M20 21a8 8 0 1 0-16 0M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" })
      })
    )
  );
}
