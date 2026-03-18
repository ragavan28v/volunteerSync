import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import { h } from "../utils/h";
import { useAuthStore } from "../store/authStore";
import { getEvent, suggestVolunteers, autoFillEvent } from "../services/api/eventsApi";
import { createAssignment } from "../services/api/assignmentsApi";
import { issueShiftToken } from "../services/api/attendanceApi";
import { Button } from "../components/ui/Button";
import { Divider } from "../components/ui/Divider";
import { fmtDateTime, fmtHours } from "../utils/format";
import { labelForSkill } from "../utils/skills";
import { useToastStore } from "../store/toastStore";

function ShiftRow({ shift, onSuggest, isBusy, onCode, codeBusy }) {
  return h(
    "div",
    { className: "flex items-start justify-between gap-3 px-3 py-3" },
    h(
      "div",
      { className: "min-w-0" },
      h(
        "div",
        { className: "text-sm font-medium text-neutral-900" },
        `${fmtDateTime(shift.start)} - ${fmtDateTime(shift.end)}`
      ),
      shift.requiredSkills && shift.requiredSkills.length
        ? h(
            "div",
            { className: "mt-0.5 text-xs text-neutral-600" },
            `Skills: ${shift.requiredSkills.map(labelForSkill).join(", ")}`
          )
        : h("div", { className: "mt-0.5 text-xs text-neutral-600" }, "Skills: Any"),
      h("div", { className: "mt-0.5 text-xs text-neutral-600" }, `Needed: ${shift.requiredVolunteers || 1}`)
    ),
    h(
      "div",
      { className: "flex shrink-0 items-center gap-2" },
      h(Button, { variant: "subtle", onClick: onSuggest, disabled: isBusy }, isBusy ? "..." : "Suggest"),
      shift._id
        ? h(
            Button,
            { variant: "ghost", onClick: onCode, disabled: codeBusy, title: "Show check-in code" },
            codeBusy ? "..." : "Code"
          )
        : null
    )
  );
}

function CodeSheet({ open, token, expiresAt, onClose }) {
  return h(
    AnimatePresence,
    null,
    open
      ? h(
          motion.div,
          {
            key: "code-overlay",
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            exit: { opacity: 0 },
            transition: { duration: 0.14 },
            className: "fixed inset-0 z-50"
          },
          h("div", { className: "absolute inset-0 bg-black/20", onClick: onClose }),
          h(
            motion.div,
            {
              initial: { y: 24, opacity: 0 },
              animate: { y: 0, opacity: 1 },
              exit: { y: 24, opacity: 0 },
              transition: { duration: 0.18 },
              onClick: (e) => e.stopPropagation(),
              className:
                "fixed bottom-0 left-0 right-0 mx-auto w-full max-w-md rounded-t-3xl border border-white/60 bg-white/95 p-4 shadow-2xl backdrop-blur"
            },
            h("div", { className: "text-sm font-semibold text-neutral-900" }, "Check-in code"),
            h("div", { className: "mt-1 text-xs text-neutral-600" }, "Volunteers must enter this code to check in."),
            h(
              "div",
              {
                className:
                  "mt-4 flex items-center justify-between rounded-2xl border border-white/60 bg-white/90 px-4 py-4 shadow-sm"
              },
              h("div", { className: "text-3xl font-bold tracking-widest text-neutral-900" }, token || "------"),
              h(
                "button",
                {
                  type: "button",
                  onClick: async () => {
                    try {
                      await navigator.clipboard.writeText(String(token || ""));
                    } catch (e) {
                      // ignore
                    }
                  },
                  className: "rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white active:opacity-80"
                },
                "Copy"
              )
            ),
            expiresAt ? h("div", { className: "mt-2 text-xs text-neutral-600" }, `Expires: ${new Date(expiresAt).toLocaleTimeString()}`) : null,
            h(Button, { variant: "subtle", className: "mt-4 w-full", onClick: onClose }, "Close")
          )
        )
      : null
  );
}

export function EventDetailPage() {
  const { id } = useParams();
  const user = useAuthStore((s) => s.user);
  const isNgo = user && user.role === "ngo";

  const qc = useQueryClient();
  const toast = useToastStore((s) => s.push);

  const qEvent = useQuery({
    queryKey: ["event", id],
    queryFn: () => getEvent(id)
  });

  const event = qEvent.data?.event;

  const [activeShift, setActiveShift] = React.useState(null);
  const [suggestions, setSuggestions] = React.useState([]);
  const [error, setError] = React.useState("");

  const [codeOpen, setCodeOpen] = React.useState(false);
  const [codeToken, setCodeToken] = React.useState("");
  const [codeExpiresAt, setCodeExpiresAt] = React.useState(null);

  const mSuggest = useMutation({
    mutationFn: ({ shiftStart, shiftEnd }) => suggestVolunteers(id, { shiftStart, shiftEnd, limit: 10 }),
    onSuccess: (data) => setSuggestions(data.suggestions || []),
    onError: (e) => setError(e?.response?.data?.error?.message || "Failed to suggest")
  });

  const mAssign = useMutation({
    mutationFn: createAssignment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assignments"] });
      qc.invalidateQueries({ queryKey: ["event", id] });
      setError("");
    },
    onError: (e) => setError(e?.response?.data?.error?.message || "Failed to assign")
  });

  const mCode = useMutation({
    mutationFn: ({ eventId, shiftId }) => issueShiftToken(eventId, shiftId),
    onSuccess: (data) => {
      setCodeToken(data.token || "");
      setCodeExpiresAt(data.expiresAt || null);
      setCodeOpen(true);
    },
    onError: () => toast({ message: "Couldn't generate code", tone: "error" })
  });

  const mAuto = useMutation({
    mutationFn: () => autoFillEvent(id, { dryRun: false }),
    onSuccess: (data) => {
      toast({ message: `Auto-filled: ${data.created} assignments`, tone: "success" });
      qc.invalidateQueries({ queryKey: ["event", id] });
      qc.invalidateQueries({ queryKey: ["assignments"] });
    },
    onError: (e) => toast({ message: e?.response?.data?.error?.message || "Auto-fill failed", tone: "error" })
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
      shiftId: activeShift._id,
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
      ...Array.from({ length: 5 }).map((_, i) => h("div", { key: i, className: "h-12 rounded-2xl bg-white/60 animate-pulse" }))
    );
  }

  if (qEvent.isError || !event) {
    return h("div", { className: "text-sm text-red-600" }, "Failed to load event");
  }

  const shifts = event.shifts && event.shifts.length
    ? event.shifts
    : [
        {
          _id: null,
          start: event.startDate,
          end: event.endDate,
          requiredVolunteers: event.requiredVolunteers,
          requiredSkills: event.requiredSkills
        }
      ];

  return h(
    "div",
    { className: "space-y-4" },
    h(CodeSheet, {
      open: codeOpen,
      token: codeToken,
      expiresAt: codeExpiresAt,
      onClose: () => setCodeOpen(false)
    }),

    h(
      "div",
      { className: "flex items-start justify-between gap-3" },
      h(
        "div",
        { className: "min-w-0" },
        h("div", { className: "text-base font-semibold text-neutral-900" }, event.title),
        h("div", { className: "mt-1 text-sm text-neutral-700" }, `${fmtDateTime(event.startDate)} - ${fmtDateTime(event.endDate)}`)
      ),
      isNgo
        ? h(
            motion.button,
            {
              type: "button",
              whileTap: { scale: 0.96 },
              onClick: () => mAuto.mutate(),
              disabled: mAuto.isPending,
              className:
                "shrink-0 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-3 py-2 text-xs font-semibold text-white shadow-sm active:opacity-90"
            },
            mAuto.isPending ? "Auto..." : "Auto-fill"
          )
        : null
    ),

    event.location ? h("div", { className: "text-sm text-neutral-700" }, event.location) : null,
    event.contact ? h("div", { className: "text-sm text-neutral-700" }, `Contact: ${event.contact}`) : null,
    event.requiredSkills && event.requiredSkills.length
      ? h("div", { className: "text-xs text-neutral-600" }, `Event skills: ${event.requiredSkills.map(labelForSkill).join(", ")}`)
      : h("div", { className: "text-xs text-neutral-600" }, "Event skills: Any"),

    h(Divider),

    h("div", { className: "text-sm font-semibold text-neutral-900" }, "Shifts"),
    h(
      "div",
      { className: "divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-white/60 bg-white/70 shadow-sm backdrop-blur" },
      shifts.map((sh, idx) =>
        isNgo
          ? h(ShiftRow, {
              key: String(sh._id || idx),
              shift: sh,
              onSuggest: () => suggestFor(sh),
              isBusy: mSuggest.isPending,
              onCode: () => mCode.mutate({ eventId: id, shiftId: sh._id }),
              codeBusy: mCode.isPending
            })
          : h(
              "div",
              { key: String(sh._id || idx), className: "px-3 py-3" },
              h("div", { className: "text-sm font-medium text-neutral-900" }, `${fmtDateTime(sh.start)} - ${fmtDateTime(sh.end)}`),
              h("div", { className: "mt-0.5 text-xs text-neutral-600" }, "Assignments are managed by the NGO")
            )
      )
    ),

    error ? h("div", { className: "text-sm text-red-600" }, error) : null,

    isNgo && activeShift
      ? h(
          "div",
          { className: "space-y-2" },
          h("div", { className: "text-sm font-semibold text-neutral-900" }, "Suggestions"),
          h(
            "div",
            { className: "divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-white/60 bg-white/70 shadow-sm backdrop-blur" },
            suggestions.length
              ? suggestions.map((s) =>
                  h(
                    "div",
                    { key: s.volunteer.id, className: "flex items-center justify-between px-3 py-3" },
                    h(
                      "div",
                      null,
                      h("div", { className: "text-sm font-medium text-neutral-900" }, s.volunteer.user?.name || "Volunteer"),
                      h("div", { className: "mt-0.5 text-xs text-neutral-600" }, `${Math.round(s.score * 100)}% - ${fmtHours(s.volunteer.totalHours)}`),
                      s.volunteer.skills && s.volunteer.skills.length
                        ? h("div", { className: "mt-0.5 text-xs text-neutral-600" }, `Skills: ${s.volunteer.skills.map(labelForSkill).join(", ")}`)
                        : null
                    ),
                    h(Button, { variant: "primary", onClick: () => assign(s.volunteer.id), disabled: mAssign.isPending }, "Assign")
                  )
                )
              : h(
                  "div",
                  { className: "px-3 py-10 text-center text-sm text-neutral-600" },
                  mSuggest.isPending ? "Matching..." : "No suggestions"
                )
          )
        )
      : null
  );
}
