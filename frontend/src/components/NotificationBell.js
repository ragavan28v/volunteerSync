import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

import { h } from "../utils/h";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead
} from "../services/api/notificationsApi";

function IconBell() {
  return h(
    "svg",
    { viewBox: "0 0 24 24", fill: "none", className: "h-5 w-5" },
    h("path", {
      d: "M15 17H9m8-2V11a5 5 0 0 0-10 0v4l-2 2h14l-2-2Z",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round"
    })
  );
}

function Row({ n, onRead }) {
  return h(
    "button",
    {
      type: "button",
      onClick: onRead,
      className: [
        "w-full text-left px-3 py-3 active:bg-neutral-50",
        n.read ? "opacity-70" : ""
      ].join(" ")
    },
    h("div", { className: "text-sm text-neutral-900" }, n.message),
    n.meta?.type
      ? h("div", { className: "mt-1 text-xs text-neutral-600" }, n.meta.type)
      : null
  );
}

export function NotificationBell() {
  const qc = useQueryClient();
  const [open, setOpen] = React.useState(false);

  const q = useQuery({
    queryKey: ["notifications"],
    queryFn: () => listNotifications({ limit: 20 })
  });

  const unread = q.data?.unreadCount || 0;
  const items = q.data?.items || [];

  const mRead = useMutation({
    mutationFn: (id) => markNotificationRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] })
  });

  const mAll = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] })
  });

  React.useEffect(() => {
    if (!open) return;
    function onKeyDown(e) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return h(
    "div",
    null,
    h(
      motion.button,
      {
        type: "button",
        whileTap: { scale: 0.96 },
        onClick: () => setOpen((v) => !v),
        className:
          "relative rounded-xl bg-white/80 px-3 py-2 text-neutral-900 shadow-sm backdrop-blur active:bg-white"
      },
      h(IconBell),
      unread
        ? h(
            "span",
            {
              className:
                "absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 text-[11px] font-semibold text-neutral-900"
            },
            String(unread)
          )
        : null
    ),

    h(
      AnimatePresence,
      null,
      open
        ? h(
            motion.div,
            {
              key: "overlay",
              initial: { opacity: 0 },
              animate: { opacity: 1 },
              exit: { opacity: 0 },
              transition: { duration: 0.14 },
              className: "fixed inset-0 z-40"
            },
            h("div", { className: "absolute inset-0 bg-black/10", onClick: () => setOpen(false) }),
            h(
              motion.div,
              {
                initial: { opacity: 0, y: -6, scale: 0.98 },
                animate: { opacity: 1, y: 0, scale: 1 },
                exit: { opacity: 0, y: -8, scale: 0.98 },
                transition: { duration: 0.18 },
                onClick: (e) => e.stopPropagation(),
                className: [
                  "fixed z-50",
                  "top-16 left-3 right-3",
                  "sm:left-auto sm:right-4 sm:w-[360px]",
                  "overflow-hidden rounded-2xl",
                  "border border-white/70 bg-white/95",
                  "shadow-xl backdrop-blur"
                ].join(" ")
              },
              h(
                "div",
                { className: "flex items-center justify-between px-3 py-2" },
                h("div", { className: "text-sm font-semibold text-neutral-900" }, "Notifications"),
                h(
                  "button",
                  {
                    type: "button",
                    onClick: () => mAll.mutate(),
                    className: "text-xs text-indigo-600 active:opacity-70"
                  },
                  "Mark all read"
                )
              ),
              h(
                "div",
                {
                  className:
                    "max-h-[60vh] overflow-auto divide-y divide-neutral-200"
                },
                items.length
                  ? items.map((n) =>
                      h(Row, {
                        key: n._id,
                        n,
                        onRead: () => mRead.mutate(n._id)
                      })
                    )
                  : h(
                      "div",
                      { className: "px-3 py-10 text-center text-sm text-neutral-600" },
                      q.isLoading ? "Loading..." : "No notifications"
                    )
              )
            )
          )
        : null
    )
  );
}
