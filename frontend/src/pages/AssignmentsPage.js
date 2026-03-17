import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { h } from "../utils/h";
import { listMyAssignments, updateMyAssignmentStatus } from "../services/api/assignmentsApi";
import { logHours } from "../services/api/hoursApi";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { fmtDateTime } from "../utils/format";

function AssignmentRow({ a, onAccept, onCancel, onLogHours, logging, hoursValue, onHoursChange }) {
  return h(
    "div",
    { className: "px-3 py-3" },
    h("div", { className: "text-sm font-medium" }, `Shift: ${fmtDateTime(a.shiftStart)} → ${fmtDateTime(a.shiftEnd)}`),
    h("div", { className: "mt-0.5 text-xs text-neutral-500" }, `Event: ${a.eventId}`),
    h("div", { className: "mt-0.5 text-xs text-neutral-500" }, `Status: ${a.status}`),

    h(
      "div",
      { className: "mt-3" },
      h(Label, null, "Hours"),
      h(Input, {
        inputMode: "decimal",
        placeholder: "e.g. 3.5",
        value: hoursValue,
        onChange: (e) => onHoursChange(e.target.value)
      })
    ),

    h(
      "div",
      { className: "mt-3 flex flex-wrap gap-2" },
      a.status === "assigned" ? h(Button, { variant: "primary", onClick: onAccept }, "Accept") : null,
      a.status !== "cancelled" ? h(Button, { variant: "subtle", onClick: onCancel }, "Cancel") : null,
      h(Button, { variant: "ghost", onClick: onLogHours, disabled: logging }, logging ? "Saving…" : "Log hours")
    )
  );
}

export function AssignmentsPage() {
  const qc = useQueryClient();
  const qMy = useQuery({ queryKey: ["assignments", "my"], queryFn: listMyAssignments });

  const [hoursById, setHoursById] = React.useState({});
  const [error, setError] = React.useState("");

  const mStatus = useMutation({
    mutationFn: ({ id, status }) => updateMyAssignmentStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assignments", "my"] }),
    onError: (e) => setError(e?.response?.data?.error?.message || "Update failed")
  });

  const mLog = useMutation({
    mutationFn: logHours,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["volunteer", "me"] });
      setError("");
    },
    onError: (e) => setError(e?.response?.data?.error?.message || "Failed to log hours")
  });

  const items = qMy.data?.items || [];

  function setHours(id, v) {
    setHoursById((p) => ({ ...p, [id]: v }));
  }

  function logFor(a) {
    const val = Number(hoursById[a._id] || 0);
    if (!val || val <= 0) {
      setError("Enter hours before logging");
      return;
    }
    setError("");
    mLog.mutate({ eventId: a.eventId, assignmentId: a._id, hours: val });
  }

  return h(
    "div",
    { className: "space-y-4" },
    h("div", { className: "text-base font-semibold" }, "My assignments"),
    error ? h("div", { className: "text-sm text-red-600" }, error) : null,

    qMy.isLoading
      ? h(
          "div",
          { className: "space-y-2" },
          ...Array.from({ length: 6 }).map((_, i) =>
            h("div", { key: i, className: "h-20 bg-neutral-200 rounded animate-pulse" })
          )
        )
      : null,

    qMy.isError ? h("div", { className: "text-sm text-red-600" }, "Failed to load assignments") : null,

    h(
      "div",
      { className: "divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white" },
      items.length
        ? items.map((a) =>
            h(AssignmentRow, {
              key: a._id,
              a,
              logging: mLog.isPending,
              hoursValue: hoursById[a._id] || "",
              onHoursChange: (v) => setHours(a._id, v),
              onAccept: () => mStatus.mutate({ id: a._id, status: "accepted" }),
              onCancel: () => mStatus.mutate({ id: a._id, status: "cancelled" }),
              onLogHours: () => logFor(a)
            })
          )
        : h("div", { className: "px-3 py-10 text-center text-sm text-neutral-500" }, "No assignments yet")
    )
  );
}
