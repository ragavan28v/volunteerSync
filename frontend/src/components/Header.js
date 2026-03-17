import React from "react";
import { useNavigate } from "react-router-dom";

import { h } from "../utils/h";
import { useAuthStore } from "../store/authStore";
import { logout } from "../services/api/authApi";

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

  return h(
    "header",
    {
      className:
        "sticky top-0 z-20 border-b border-neutral-200 bg-white/90 backdrop-blur"
    },
    h(
      "div",
      { className: "mx-auto flex max-w-md items-center justify-between px-4 py-3" },
      h(
        "div",
        null,
        h("div", { className: "text-sm font-semibold" }, "Volunteer Coordination"),
        h(
          "div",
          { className: "text-xs text-neutral-500" },
          user ? `${user.name} · ${user.role}` : ""
        )
      ),
      h(
        "button",
        {
          type: "button",
          onClick: onLogout,
          className:
            "rounded-md px-3 py-2 text-sm text-neutral-700 active:bg-neutral-100"
        },
        "Logout"
      )
    )
  );
}
