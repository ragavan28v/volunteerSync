import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import { h } from "../utils/h";
import { useAuthStore } from "../store/authStore";
import { getOverview } from "../services/api/analyticsApi";
import { getMyVolunteerProfile } from "../services/api/volunteersApi";
import { listMyAssignments } from "../services/api/assignmentsApi";
import { recommendedEvents, interestInEvent } from "../services/api/eventsApi";
import { Button } from "../components/ui/Button";
import { useToastStore } from "../store/toastStore";
import { fmtDateTime, fmtHours } from "../utils/format";

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

function StatPill({ label, value, tone }) {
  const bg =
    tone === "indigo"
      ? "from-indigo-500/15 to-cyan-500/10"
      : tone === "cyan"
        ? "from-cyan-500/15 to-indigo-500/10"
        : "from-slate-500/10 to-blue-500/10";

  return h(
    "div",
    {
      className:
        "rounded-2xl border border-white/60 bg-gradient-to-b p-4 shadow-sm backdrop-blur " + bg
    },
    h("div", { className: "text-xs font-medium text-neutral-700" }, label),
    h("div", { className: "mt-1 text-2xl font-bold text-neutral-900" }, value)
  );
}

function ProgressBar({ value, max }) {
  const pct = Math.max(0, Math.min(1, max ? value / max : 0));
  return h(
    "div",
    { className: "mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200/70" },
    h(motion.div, {
      initial: { width: 0 },
      animate: { width: `${Math.round(pct * 100)}%` },
      transition: { duration: 0.4 },
      className: "h-full bg-gradient-to-r from-indigo-600 to-cyan-500"
    })
  );
}

function RecRow({ r, onOpen, onInterest }) {
  const e = r.event;
  return h(
    "div",
    { className: "rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur" },
    h(
      "button",
      { type: "button", onClick: onOpen, className: "w-full text-left" },
      h("div", { className: "text-sm font-semibold text-neutral-900" }, e.title),
      h("div", { className: "mt-1 text-xs text-neutral-600" }, `${fmtDateTime(e.startDate)} - ${fmtDateTime(e.endDate)}`)
    ),
    h("div", { className: "mt-3" }, h(Button, { className: "w-full", onClick: onInterest }, "I'm interested"))
  );
}

function QuickLink({ to, title, subtitle, tone, icon }) {
  const strip =
    tone === "indigo"
      ? "from-indigo-600 to-cyan-500"
      : tone === "cyan"
        ? "from-cyan-500 to-indigo-500"
        : "from-violet-600 to-indigo-500";

  return h(
    Link,
    {
      to,
      className:
        "group overflow-hidden rounded-2xl border border-white/60 bg-white/70 shadow-sm backdrop-blur active:bg-white/80"
    },
    h("div", { className: `h-1 w-full bg-gradient-to-r ${strip}` }),
    h(
      "div",
      { className: "flex items-center gap-3 px-3 py-2.5" },
      h(
        "div",
        { className: "mt-0.5 rounded-xl bg-white/70 p-2 text-neutral-900 shadow-sm" },
        h(Icon, { d: icon })
      ),
      h(
        "div",
        { className: "min-w-0" },
        h("div", { className: "text-sm font-semibold text-neutral-900" }, title),
        h("div", { className: "mt-0.5 text-[11px] leading-4 text-neutral-600 truncate" }, subtitle)
      )
    )
  );
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const isNgo = user && user.role === "ngo";

  const navigate = useNavigate();
  const toast = useToastStore((s) => s.push);

  const qNgo = useQuery({
    queryKey: ["analytics", "overview"],
    queryFn: getOverview,
    enabled: isNgo
  });

  const qVolunteerProfile = useQuery({
    queryKey: ["volunteer", "me"],
    queryFn: getMyVolunteerProfile,
    enabled: !isNgo
  });

  const qMyAssignments = useQuery({
    queryKey: ["assignments", "my"],
    queryFn: listMyAssignments,
    enabled: !isNgo
  });

  const qRecommended = useQuery({
    queryKey: ["events", "recommended"],
    queryFn: recommendedEvents,
    enabled: !isNgo
  });

  async function interest(id) {
    try {
      await interestInEvent(id);
      toast({ message: "Sent to NGO - they'll contact you if needed", tone: "success" });
    } catch (e) {
      toast({ message: "Couldn't send interest", tone: "error" });
    }
  }

  if (isNgo) {
    const data = qNgo.data;
    const totals = data?.totals;

    return h(
      "div",
      { className: "space-y-5" },
      h("div", { className: "text-base font-semibold text-neutral-900" }, "NGO dashboard"),
      h(
        "div",
        { className: "grid grid-cols-2 gap-3" },
        h(StatPill, { label: "Volunteers", value: totals ? totals.volunteers : "...", tone: "indigo" }),
        h(StatPill, { label: "Active events", value: totals ? totals.activeEvents : "...", tone: "cyan" })
      ),
      h(StatPill, { label: "Verified hours served", value: totals ? fmtHours(totals.totalHours) : "...", tone: "indigo" }),
      h(
        "div",
        { className: "grid grid-cols-2 gap-3" },
        h(QuickLink, {
          to: "/app/events",
          title: "Create events",
          subtitle: "Shifts & skills",
          tone: "indigo",
          icon: "M8 7V4m8 3V4M5 10h14M6 20h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2Z"
        }),
        h(QuickLink, {
          to: "/app/admin/volunteers",
          title: "Volunteer directory",
          subtitle: "Filter by skill",
          tone: "cyan",
          icon: "M20 21a8 8 0 1 0-16 0M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
        })
      ),
      qNgo.isError ? h("div", { className: "text-sm text-rose-600" }, "Failed to load analytics") : null
    );
  }

  const totalHours = qVolunteerProfile.data?.volunteer?.totalHours || 0;
  const assignmentsCount = qMyAssignments.data?.items?.length || 0;
  const recommended = qRecommended.data?.recommended || [];

  return h(
    "div",
    { className: "space-y-5" },
    h("div", { className: "text-base font-semibold text-neutral-900" }, "Your dashboard"),

    h(
      "div",
      { className: "grid grid-cols-2 gap-3" },
      h(StatPill, { label: "Hours served", value: `${fmtHours(totalHours)}`, tone: "indigo" }),
      h(StatPill, { label: "Assignments", value: String(assignmentsCount), tone: "cyan" })
    ),

    h(
      "div",
      { className: "rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur" },
      h("div", { className: "text-sm font-semibold text-neutral-900" }, "Progress"),
      h("div", { className: "mt-1 text-xs text-neutral-600" }, "Keep going - every hour counts"),
      h(ProgressBar, { value: totalHours, max: 50 }),
      h("div", { className: "mt-2 text-xs text-neutral-600" }, `${fmtHours(Math.min(50, totalHours))} / 50h this season`)
    ),

    recommended.length
      ? h(
          "div",
          { className: "space-y-2" },
          h(
            "div",
            { className: "flex items-center justify-between" },
            h("div", { className: "text-sm font-semibold text-neutral-900" }, "Recommended for you"),
            h(
              "button",
              {
                type: "button",
                className: "text-xs text-indigo-700 underline",
                onClick: () => navigate("/app/events")
              },
              "See all"
            )
          ),
          ...recommended.slice(0, 3).map((r) =>
            h(RecRow, {
              key: r.event._id,
              r,
              onOpen: () => navigate(`/app/events/${r.event._id}`),
              onInterest: () => interest(r.event._id)
            })
          )
        )
      : null
  );
}
