import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import enUS from "date-fns/locale/en-US";
import { useNavigate } from "react-router-dom";

import { h } from "../utils/h";
import { useAuthStore } from "../store/authStore";
import { listEvents, createEvent } from "../services/api/eventsApi";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { Divider } from "../components/ui/Divider";
import { fmtDateTime, fromLocalInputValue, skillsToArray } from "../utils/format";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales: { "en-US": enUS }
});

function EventRow({ e, onOpen }) {
  return h(
    "button",
    {
      type: "button",
      onClick: () => onOpen(e._id),
      className: "w-full text-left px-3 py-3 active:bg-neutral-50"
    },
    h("div", { className: "text-sm font-medium" }, e.title),
    h(
      "div",
      { className: "mt-0.5 text-xs text-neutral-500" },
      `${fmtDateTime(e.startDate)} → ${fmtDateTime(e.endDate)}`
    ),
    e.location ? h("div", { className: "mt-0.5 text-xs text-neutral-500" }, e.location) : null
  );
}

export function EventsPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user && user.role === "admin";

  const navigate = useNavigate();
  const qc = useQueryClient();

  const [view, setView] = React.useState("list");
  const [q, setQ] = React.useState("");

  const qEvents = useQuery({
    queryKey: ["events", { q }],
    queryFn: () => listEvents({ q, page: 1, limit: 100 })
  });

  const items = qEvents.data?.items || [];

  const calendarEvents = items.map((e) => ({
    id: e._id,
    title: e.title,
    start: new Date(e.startDate),
    end: new Date(e.endDate)
  }));

  const [showCreate, setShowCreate] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [requiredVolunteers, setRequiredVolunteers] = React.useState("1");
  const [requiredSkillsText, setRequiredSkillsText] = React.useState("");
  const [error, setError] = React.useState("");

  const mCreate = useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
      setShowCreate(false);
      setTitle("");
      setLocation("");
      setStartDate("");
      setEndDate("");
      setRequiredVolunteers("1");
      setRequiredSkillsText("");
    },
    onError: (e) => setError(e?.response?.data?.error?.message || "Failed to create event")
  });

  function openEvent(id) {
    navigate(`/app/events/${id}`);
  }

  function submitCreate(e) {
    e.preventDefault();
    setError("");
    const payload = {
      title,
      location,
      description: "",
      startDate: fromLocalInputValue(startDate),
      endDate: fromLocalInputValue(endDate),
      requiredVolunteers: Number(requiredVolunteers || 1),
      requiredSkills: skillsToArray(requiredSkillsText),
      shifts: []
    };

    mCreate.mutate(payload);
  }

  return h(
    "div",
    { className: "space-y-4" },
    h(
      "div",
      { className: "flex items-center justify-between" },
      h("div", { className: "text-base font-semibold" }, "Events"),
      h(
        "div",
        { className: "flex items-center gap-2" },
        h(
          Button,
          { variant: "subtle", onClick: () => setView(view === "list" ? "calendar" : "list") },
          view === "list" ? "Calendar" : "List"
        ),
        isAdmin
          ? h(
              Button,
              { variant: "primary", onClick: () => setShowCreate((v) => !v) },
              showCreate ? "Close" : "New"
            )
          : null
      )
    ),
    h(Input, { value: q, onChange: (e) => setQ(e.target.value), placeholder: "Search events…" }),

    showCreate
      ? h(
          "form",
          {
            onSubmit: submitCreate,
            className: "rounded-lg border border-neutral-200 bg-white p-3 space-y-3"
          },
          h("div", { className: "text-sm font-medium" }, "Create event"),
          h("div", null, h(Label, null, "Title"), h(Input, { value: title, onChange: (e) => setTitle(e.target.value), required: true })),
          h("div", null, h(Label, null, "Location"), h(Input, { value: location, onChange: (e) => setLocation(e.target.value) })),
          h(
            "div",
            { className: "grid grid-cols-1 gap-3" },
            h("div", null, h(Label, null, "Start"), h(Input, { type: "datetime-local", value: startDate, onChange: (e) => setStartDate(e.target.value), required: true })),
            h("div", null, h(Label, null, "End"), h(Input, { type: "datetime-local", value: endDate, onChange: (e) => setEndDate(e.target.value), required: true }))
          ),
          h(
            "div",
            { className: "grid grid-cols-2 gap-3" },
            h("div", null, h(Label, null, "Volunteers"), h(Input, { inputMode: "numeric", value: requiredVolunteers, onChange: (e) => setRequiredVolunteers(e.target.value) })),
            h("div", null, h(Label, null, "Skills (comma)"), h(Input, { value: requiredSkillsText, onChange: (e) => setRequiredSkillsText(e.target.value), placeholder: "first-aid, teaching" }))
          ),
          error ? h("div", { className: "text-sm text-red-600" }, error) : null,
          h(
            Button,
            { type: "submit", disabled: mCreate.isPending, className: "w-full" },
            mCreate.isPending ? "Creating…" : "Create"
          )
        )
      : null,

    qEvents.isLoading
      ? h(
          "div",
          { className: "space-y-2" },
          ...Array.from({ length: 6 }).map((_, i) =>
            h("div", { key: i, className: "h-14 rounded bg-neutral-200 animate-pulse" })
          )
        )
      : null,

    qEvents.isError ? h("div", { className: "text-sm text-red-600" }, "Failed to load events") : null,

    view === "list"
      ? h(
          "div",
          { className: "divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white" },
          items.length
            ? items.map((e) => h(EventRow, { key: e._id, e, onOpen: openEvent }))
            : h("div", { className: "px-3 py-10 text-center text-sm text-neutral-500" }, "No events")
        )
      : h(
          "div",
          { className: "rounded-lg border border-neutral-200 bg-white overflow-hidden" },
          h(
            "div",
            { className: "h-[520px]" },
            h(Calendar, {
              localizer,
              events: calendarEvents,
              startAccessor: "start",
              endAccessor: "end",
              views: ["month", "agenda"],
              defaultView: "month",
              popup: true,
              onSelectEvent: (e) => openEvent(e.id)
            })
          ),
          h(Divider)
        )
  );
}
