import React from "react";
import dayjs from "dayjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { h } from "../utils/h";
import { useAuthStore } from "../store/authStore";
import { listMyAssignments, updateMyAssignmentStatus } from "../services/api/assignmentsApi";
import { checkIn, checkOut } from "../services/api/attendanceApi";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { fmtDateTime, fmtHours } from "../utils/format";

function statusFor(a) {
  const now = dayjs();
  const start = dayjs(a.shiftStart);
  const end = dayjs(a.shiftEnd);
  if (end.isBefore(now)) return "completed";
  if (start.isBefore(now) && end.isAfter(now)) return "ongoing";
  return "upcoming";
}

function StatusPill({ s }) {
  const map = {
    upcoming: "bg-indigo-500/10 text-neutral-900",
    ongoing: "bg-cyan-500/10 text-neutral-900",
    completed: "bg-emerald-500/10 text-neutral-900"
  };
  const label = s === "ongoing" ? "Ongoing" : s === "completed" ? "Completed" : "Upcoming";

  return h(
    "span",
    { className: ["rounded-full px-2 py-0.5 text-[11px] font-medium", map[s]].join(" ") },
    label
  );
}

function Dot({ s }) {
  const map = {
    upcoming: "bg-indigo-600",
    ongoing: "bg-cyan-600",
    completed: "bg-emerald-600"
  };
  return h("div", { className: ["mt-1 h-2.5 w-2.5 rounded-full", map[s]].join(" ") });
}

function Item({ a, tokenValue, onTokenChange, onAccept, onCancel, onCheckIn, onCheckOut, busy, attendance }) {
  const s = statusFor(a);
  const e = a.event;

  const checkedIn = Boolean(attendance && attendance.checkInAt);
  const checkedOut = Boolean(attendance && attendance.checkOutAt);

  return h(
    "div",
    { className: "relative flex gap-3" },
    h(
      "div",
      { className: "flex flex-col items-center" },
      h(Dot, { s }),
      h("div", { className: "mt-2 w-px flex-1 bg-gradient-to-b from-slate-200 to-transparent" })
    ),
    h(
      "div",
      { className: "flex-1 rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur" },
      h(
        "div",
        { className: "flex items-start justify-between gap-3" },
        h(
          "div",
          { className: "min-w-0" },
          h(
            "div",
            { className: "text-sm font-semibold text-neutral-900" },
            `${fmtDateTime(a.shiftStart)} - ${fmtDateTime(a.shiftEnd)}`
          ),
          h(
            "div",
            { className: "mt-1 text-xs text-neutral-600 truncate" },
            e?.title ? `Event: ${e.title}` : `Event: ${a.eventId}`
          ),
          e?.location ? h("div", { className: "mt-1 text-xs text-neutral-600 truncate" }, e.location) : null
        ),
        h(StatusPill, { s })
      ),

      e?.contact ? h("div", { className: "mt-2 text-xs text-neutral-600" }, `Contact: ${e.contact}`) : null,

      h(
        "div",
        { className: "mt-3" },
        h("div", { className: "text-xs font-medium text-neutral-700" }, "Check-in code"),
        h(
          "div",
          { className: "mt-1 flex gap-2" },
          h(Input, {
            value: tokenValue,
            onChange: (ev) => onTokenChange(ev.target.value),
            placeholder: "Enter 6-digit code",
            inputMode: "numeric",
            disabled: checkedIn
          }),
          h(
            Button,
            { variant: "primary", onClick: onCheckIn, disabled: busy || checkedIn || !tokenValue },
            checkedIn ? "Checked in" : "Check in"
          )
        ),
        checkedIn ? h("div", { className: "mt-1 text-xs text-neutral-600" }, `Checked in at ${new Date(attendance.checkInAt).toLocaleTimeString()}`) : null
      ),

      h(
        "div",
        { className: "mt-3 flex flex-wrap gap-2" },
        a.status === "assigned" ? h(Button, { onClick: onAccept, disabled: busy }, "Accept") : null,
        a.status !== "cancelled" ? h(Button, { variant: "subtle", onClick: onCancel, disabled: busy }, "Cancel") : null,
        checkedIn && !checkedOut
          ? h(Button, { variant: "ghost", onClick: onCheckOut, disabled: busy }, "Check out")
          : null,
        checkedOut && attendance?.hours
          ? h(
              "div",
              { className: "rounded-xl bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-neutral-900" },
              `${fmtHours(attendance.hours)} logged`
            )
          : null
      )
    )
  );
}

export function AssignmentsPage() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  if (user && user.role === "ngo") {
    return h(
      "div",
      { className: "space-y-3" },
      h("div", { className: "text-base font-semibold text-neutral-900" }, "Timeline"),
      h(
        "div",
        { className: "rounded-2xl border border-white/60 bg-white/70 p-4 text-sm text-neutral-700 shadow-sm backdrop-blur" },
        "Timeline is a volunteer view that lists assigned shifts and supports check-in/out. As an NGO, use Events and Hours."
      )
    );
  }

  const qMy = useQuery({ queryKey: ["assignments", "my"], queryFn: listMyAssignments });

  const [tokenById, setTokenById] = React.useState({});
  const [attendanceById, setAttendanceById] = React.useState({});
  const [error, setError] = React.useState("");

  const mStatus = useMutation({
    mutationFn: ({ id, status }) => updateMyAssignmentStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assignments", "my"] }),
    onError: (e) => setError(e?.response?.data?.error?.message || "Update failed")
  });

  const mCheckIn = useMutation({
    mutationFn: ({ assignmentId, token }) => checkIn({ assignmentId, token }),
    onSuccess: (data) => {
      const att = data.attendance;
      if (att?.assignmentId) {
        setAttendanceById((p) => ({ ...p, [String(att.assignmentId)]: att }));
      }
      setError("");
    },
    onError: (e) => setError(e?.response?.data?.error?.message || "Check-in failed")
  });

  const mCheckOut = useMutation({
    mutationFn: ({ assignmentId }) => checkOut({ assignmentId }),
    onSuccess: (data) => {
      const att = data.attendance;
      if (att?.assignmentId) {
        setAttendanceById((p) => ({ ...p, [String(att.assignmentId)]: att }));
      }
      setError("");
      qc.invalidateQueries({ queryKey: ["volunteer", "me"] });
    },
    onError: (e) => setError(e?.response?.data?.error?.message || "Check-out failed")
  });

  const items = qMy.data?.items || [];
  const busy = mStatus.isPending || mCheckIn.isPending || mCheckOut.isPending;

  function setToken(id, v) {
    setTokenById((p) => ({ ...p, [id]: v }));
  }

  return h(
    "div",
    { className: "space-y-4" },
    h("div", { className: "text-base font-semibold text-neutral-900" }, "My timeline"),
    h("div", { className: "text-xs text-neutral-600" }, "Use check-in/out to log verified hours."),
    error ? h("div", { className: "rounded-2xl border border-white/60 bg-white/70 p-3 text-sm text-rose-700 shadow-sm backdrop-blur" }, error) : null,

    qMy.isLoading
      ? h(
          "div",
          { className: "space-y-2" },
          ...Array.from({ length: 4 }).map((_, i) => h("div", { key: i, className: "h-28 rounded-2xl bg-white/60 animate-pulse" }))
        )
      : null,

    qMy.isError
      ? h(
          "div",
          { className: "rounded-2xl border border-white/60 bg-white/70 p-4 text-sm text-rose-700 shadow-sm backdrop-blur" },
          "Failed to load assignments."
        )
      : null,

    items.length
      ? h(
          "div",
          { className: "space-y-3" },
          ...items.map((a) =>
            h(Item, {
              key: a._id,
              a,
              busy,
              tokenValue: tokenById[a._id] || "",
              onTokenChange: (v) => setToken(a._id, v),
              attendance: attendanceById[a._id] || null,
              onAccept: () => mStatus.mutate({ id: a._id, status: "accepted" }),
              onCancel: () => mStatus.mutate({ id: a._id, status: "cancelled" }),
              onCheckIn: () => mCheckIn.mutate({ assignmentId: a._id, token: tokenById[a._id] || "" }),
              onCheckOut: () => mCheckOut.mutate({ assignmentId: a._id })
            })
          )
        )
      : h(
          "div",
          { className: "rounded-2xl border border-white/60 bg-white/70 px-4 py-10 text-center text-sm text-neutral-700 shadow-sm backdrop-blur" },
          "No assignments yet"
        )
  );
}
