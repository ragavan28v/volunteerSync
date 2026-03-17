import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

import { h } from "../utils/h";
import { useAuthStore } from "../store/authStore";
import { getEvent, suggestVolunteers } from "../services/api/eventsApi";
import { createAssignment } from "../services/api/assignmentsApi";
import { Button } from "../components/ui/Button";
import { Divider } from "../components/ui/Divider";
import { fmtDateTime } from "../utils/format";

function ShiftRow({ shift, onSuggest, isBusy }) {
  return h(
    "div",
    { className: "flex items-center justify-between px-3 py-3" },
    h(
      "div",
      null,
      h(
        "div",
        { className: "text-sm font-medium" },
        `${fmtDateTime(shift.start)} → ${fmtDateTime(shift.end)}`
      ),
      shift.requiredSkills && shift.requiredSkills.length
        ? h(
            "div",
            { className: "mt-0.5 text-xs text-neutral-500" },
            `Skills: ${shift.requiredSkills.join(", ")}`
          )
        : null,
      h(
        "div",
        { className: "mt-0.5 text-xs text-neutral-500" },
        `Needed: ${shift.requiredVolunteers || 1}`
      )
    ),
    h(
      Button,
      { variant: "subtle", onClick: onSuggest, disabled: isBusy },
      isBusy ? "…" : "Suggest"
    )
  );
}

export function EventDetailPage() {
  const { id } = useParams();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user && user.role === "admin";

  const qc = useQueryClient();

  const qEvent = useQuery({ queryKey: ["event", id], queryFn: () => getEvent(id) });
  const event = qEvent.data?.event;

  const [activeShift, setActiveShift] = React.useState(null);
  const [suggestions, setSuggestions] = React.useState([]);
  const [error, setError] = React.useState("");

  const mSuggest = useMutation({
    mutationFn: ({ shiftStart, shiftEnd }) => suggestVolunteers(id, { shiftStart, shiftEnd, limit: 10 }),
    onSuccess: (data) => {
      setSuggestions(data.suggestions || []);
    },
    onError: (e) => setError(e?.response?.data?.error?.message || "Failed to suggest")
  });

  const mAssign = useMutation({
    mutationFn: createAssignment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assignments"] });
    },
    onError: (e) => setError(e?.response?.data?.error?.message || "Failed to assign")
  });

  function suggestFor(shift) {
    setError("");
    setActiveShift(shift);
    setSuggestions([]);
    mSuggest.mutate({ shiftStart: shift.start, shiftEnd: shift.end });
  }

  function assign(volunteerId) {
    if (!activeShift) return;
    setError("");
    mAssign.mutate({
      volunteerId,
      eventId: id,
      shiftStart: activeShift.start,
      shiftEnd: activeShift.end,
      role: "",
      status: "assigned"
    });
  }

  if (qEvent.isLoading) {
    return h(
      "div",
      { className: "space-y-2" },
      ...Array.from({ length: 5 }).map((_, i) =>
        h("div", { key: i, className: "h-12 bg-neutral-200 rounded animate-pulse" })
      )
    );
  }

  if (qEvent.isError || !event) {
    return h("div", { className: "text-sm text-red-600" }, "Failed to load event");
  }

  const shifts = event.shifts && event.shifts.length
    ? event.shifts
    : [{
        start: event.startDate,
        end: event.endDate,
        requiredVolunteers: event.requiredVolunteers,
        requiredSkills: event.requiredSkills
      }];

  return h(
    "div",
    { className: "space-y-4" },
    h("div", { className: "text-base font-semibold" }, event.title),
    h(
      "div",
      { className: "text-sm text-neutral-600" },
      `${fmtDateTime(event.startDate)} → ${fmtDateTime(event.endDate)}`
    ),
    event.location ? h("div", { className: "text-sm text-neutral-600" }, event.location) : null,
    event.requiredSkills && event.requiredSkills.length
      ? h(
          "div",
          { className: "text-xs text-neutral-500" },
          `Event skills: ${event.requiredSkills.join(", ")}`
        )
      : null,

    h(Divider),

    h("div", { className: "text-sm font-medium text-neutral-700" }, "Shifts"),
    h(
      "div",
      { className: "divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white" },
      shifts.map((sh, idx) =>
        isAdmin
          ? h(ShiftRow, { key: idx, shift: sh, onSuggest: () => suggestFor(sh), isBusy: mSuggest.isPending })
          : h(
              "div",
              { key: idx, className: "px-3 py-3" },
              h(
                "div",
                { className: "text-sm font-medium" },
                `${fmtDateTime(sh.start)} → ${fmtDateTime(sh.end)}`
              ),
              h(
                "div",
                { className: "mt-0.5 text-xs text-neutral-500" },
                "Assignments are managed by the NGO admin"
              )
            )
      )
    ),

    error ? h("div", { className: "text-sm text-red-600" }, error) : null,

    isAdmin && activeShift
      ? h(
          "div",
          { className: "space-y-2" },
          h("div", { className: "text-sm font-medium text-neutral-700" }, "Suggestions"),
          h(
            "div",
            { className: "divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white" },
            suggestions.length
              ? suggestions.map((s) =>
                  h(
                    "div",
                    { key: s.volunteer.id, className: "flex items-center justify-between px-3 py-3" },
                    h(
                      "div",
                      null,
                      h("div", { className: "text-sm font-medium" }, s.volunteer.user?.name || "Volunteer"),
                      h(
                        "div",
                        { className: "mt-0.5 text-xs text-neutral-500" },
                        `${Math.round(s.score * 100)}% · ${s.volunteer.totalHours}h`
                      ),
                      s.volunteer.skills && s.volunteer.skills.length
                        ? h(
                            "div",
                            { className: "mt-0.5 text-xs text-neutral-500" },
                            `Skills: ${s.volunteer.skills.join(", ")}`
                          )
                        : null
                    ),
                    h(
                      Button,
                      { variant: "primary", onClick: () => assign(s.volunteer.id), disabled: mAssign.isPending },
                      "Assign"
                    )
                  )
                )
              : h(
                  "div",
                  { className: "px-3 py-10 text-center text-sm text-neutral-500" },
                  mSuggest.isPending ? "Matching…" : "No suggestions"
                )
          )
        )
      : null
  );
}
