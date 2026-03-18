import React from "react";
import { NavLink } from "react-router-dom";

import { h } from "../utils/h";
import { useAuthStore } from "../store/authStore";

function Icon({ d, className }) {
  return h(
    "svg",
    { viewBox: "0 0 24 24", fill: "none", className: className || "h-5 w-5" },
    h("path", {
      d,
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round"
    })
  );
}

function Tab({ to, label, iconPath, end }) {
  return h(
    NavLink,
    {
      to,
      end: Boolean(end),
      className: ({ isActive }) =>
        [
          "group relative flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px]",
          isActive ? "text-indigo-700" : "text-slate-600"
        ].join(" ")
    },
    ({ isActive }) =>
      h(
        React.Fragment,
        null,
        h(
          "div",
          {
            className: [
              "flex h-9 w-9 items-center justify-center rounded-2xl",
              isActive
                ? "bg-gradient-to-br from-indigo-600 to-cyan-500 text-white shadow-sm"
                : "bg-white/60 text-slate-700"
            ].join(" ")
          },
          h(Icon, { d: iconPath, className: "h-5 w-5" })
        ),
        h("div", { className: ["font-medium", isActive ? "text-neutral-900" : ""].join(" ") }, label),
        h("div", {
          className: [
            "absolute bottom-1 h-1 w-6 rounded-full",
            "bg-gradient-to-r from-indigo-600 to-cyan-500",
            isActive ? "opacity-100" : "opacity-0"
          ].join(" ")
        })
      )
  );
}

export function BottomNav() {
  const user = useAuthStore((s) => s.user);
  const isNgo = user && user.role === "ngo";

  return h(
    "nav",
    {
      className:
        "fixed bottom-0 left-0 right-0 z-20 border-t border-white/50 bg-white/75 shadow-[0_-8px_20px_-20px_rgba(15,23,42,0.45)] backdrop-blur"
    },
    h(
      "div",
      { className: "mx-auto grid max-w-md grid-cols-4" },
      h(Tab, {
        to: "/app",
        end: true,
        label: "Home",
        iconPath: "M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
      }),
      h(Tab, {
        to: "/app/events",
        label: "Events",
        iconPath: "M8 7V4m8 3V4M5 10h14M6 20h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2Z"
      }),
      isNgo
        ? h(Tab, {
            to: "/app/admin/hours",
            label: "Hours",
            iconPath: "M12 6v6l4 2M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z"
          })
        : h(Tab, {
            to: "/app/assignments",
            label: "Timeline",
            iconPath: "M9 12h6M9 16h6M7 20h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H9l-2 2H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2Z"
          }),
      h(Tab, {
        to: "/app/profile",
        label: "Profile",
        iconPath: "M20 21a8 8 0 1 0-16 0M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
      })
    )
  );
}
