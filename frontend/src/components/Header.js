import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import { h } from "../utils/h";
import { useAuthStore } from "../store/authStore";
import { logout } from "../services/api/authApi";
import { NotificationBell } from "./NotificationBell";

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

function getInitials(name) {
  const s = String(name || "").trim();
  if (!s) return "VS";
  const parts = s.split(/\s+/).filter(Boolean);
  const a = parts[0] ? parts[0][0] : "V";
  const b = parts.length > 1 ? parts[parts.length - 1][0] : "S";
  return (a + b).toUpperCase();
}

function avatarTone(seed) {
  const str = String(seed || "");
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) hash = (hash * 31 + str.charCodeAt(i)) % 997;
  const tones = [
    "from-indigo-600 to-cyan-500",
    "from-cyan-500 to-emerald-500",
    "from-blue-600 to-indigo-500",
    "from-violet-600 to-indigo-500"
  ];
  return tones[hash % tones.length];
}

function Avatar({ name, role }) {
  return h(
    "div",
    {
      className: [
        "h-9 w-9 shrink-0 rounded-2xl text-white shadow-sm",
        "bg-gradient-to-br",
        avatarTone(`${name}-${role}`),
        "flex items-center justify-center"
      ].join(" ")
    },
    h("div", { className: "text-xs font-bold tracking-wide" }, getInitials(name))
  );
}

export function Header() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);

  async function onLogout() {
    try {
      await logout();
    } catch (e) {
      // ignore
    }
    clear();
    navigate("/login", { replace: true });
  }

  const roleLabel = user?.role === "ngo" ? "NGO" : user?.role === "volunteer" ? "Volunteer" : "";

  return h(
    "header",
    {
      className: "sticky top-0 z-20 border-b border-white/50 bg-white/75 backdrop-blur"
    },
    h(
      "div",
      { className: "mx-auto flex max-w-md items-center justify-between px-4 py-3" },
      h(
        "div",
        { className: "flex min-w-0 flex-1 items-center gap-3" },
        h(Avatar, { name: user?.name || "VolunteerSync", role: user?.role || "" }),
        h(
          "div",
          { className: "min-w-0" },
          h(
            "div",
            { className: "text-sm font-semibold text-neutral-900" },
            "VolunteerSync"
          ),
          h(
            "div",
            { className: "mt-0.5 flex min-w-0 items-center gap-2" },
            h(
              "div",
              { className: "min-w-0 flex-1 truncate text-xs text-neutral-600" },
              user ? user.name : ""
            ),
            roleLabel
              ? h(
                  "span",
                  { className: "shrink-0 rounded-full bg-indigo-500/10 px-2 py-0.5 text-[11px] font-semibold text-indigo-700" },
                  roleLabel
                )
              : null
          )
        )
      ),
      h(
        "div",
        { className: "flex shrink-0 items-center gap-2" },
        h(NotificationBell),
        h(
          motion.button,
          {
            type: "button",
            whileTap: { scale: 0.96 },
            onClick: onLogout,
            className:
              "group relative rounded-xl bg-white/80 px-3 py-2 text-rose-600 shadow-sm backdrop-blur active:bg-rose-50",
            title: "Logout"
          },
          h(Icon, {
            d: "M10 7V5a2 2 0 0 1 2-2h7v18h-7a2 2 0 0 1-2-2v-2m-6-5h10m0 0-3-3m3 3-3 3"
          }),
          h("span", { className: "sr-only" }, "Logout"),
          h(
            "span",
            {
              className:
                "pointer-events-none absolute -bottom-9 right-0 hidden rounded-xl bg-rose-600 px-2 py-1 text-[11px] font-medium text-white shadow-sm group-hover:block"
            },
            "Logout"
          )
        )
      )
    )
  );
}
