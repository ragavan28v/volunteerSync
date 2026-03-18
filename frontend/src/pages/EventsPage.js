import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import enUS from "date-fns/locale/en-US";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import { motion, AnimatePresence } from "framer-motion";

import { h } from "../utils/h";
import { useAuthStore } from "../store/authStore";
import {
  listEvents,
  createEvent,
  recommendedEvents,
  interestInEvent,
  raiseQuery
} from "../services/api/eventsApi";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { Divider } from "../components/ui/Divider";
import { fmtDateTime, fromLocalInputValue } from "../utils/format";
import { useToastStore } from "../store/toastStore";
import { SKILL_OPTIONS, labelForSkill } from "../utils/skills";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales: { "en-US": enUS }
});

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

function ensureInputVisible(e) {
  try {
    const el = e && e.target;
    if (!el || !el.scrollIntoView) return;
    setTimeout(() => {
      try {
        el.scrollIntoView({ block: "center", behavior: "smooth" });
      } catch {
        // ignore
      }
    }, 50);
  } catch {
    // ignore
  }
}


function selectStyles() {
  return {
    control: (base, state) => ({
      ...base,
      borderRadius: 14,
      borderColor: state.isFocused ? "#6366f1" : "#e2e8f0",
      boxShadow: "none",
      minHeight: 46,
      backgroundColor: "rgba(255,255,255,0.95)",
      width: "100%"
    }),
    valueContainer: (base) => ({ ...base, padding: "2px 10px" }),
    menuPortal: (base) => ({ ...base, zIndex: 80 }),
    menu: (base) => ({ ...base, zIndex: 80 }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: "rgba(99, 102, 241, 0.10)",
      borderRadius: 999
    }),
    multiValueLabel: (base) => ({ ...base, color: "#111827", fontSize: 12 }),
    multiValueRemove: (base) => ({ ...base, borderRadius: 999 })
  };
}

const NONE_SKILL = { value: "__none__", label: "No specific skills required" };
const EVENT_SKILL_OPTIONS = [NONE_SKILL, ...SKILL_OPTIONS];

function SkillTag({ text }) {
  return h(
    "span",
    {
      className:
        "inline-flex items-center rounded-full bg-indigo-500/10 px-2 py-0.5 text-[11px] font-medium text-neutral-900"
    },
    text
  );
}

function QuerySheet({ open, eventTitle, value, onChange, onClose, onSend, busy }) {
  return h(
    AnimatePresence,
    null,
    open
      ? h(
          motion.div,
          {
            key: "q-overlay",
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
            h("div", { className: "text-sm font-semibold text-neutral-900" }, "Raise a query"),
            eventTitle
              ? h(
                  "div",
                  { className: "mt-1 text-xs text-neutral-600" },
                  `About: ${eventTitle}`
                )
              : null,
            h(
              "div",
              { className: "mt-3" },
              h("div", { className: "mb-1 text-xs font-medium text-neutral-700" }, "Your message"),
              h("textarea", {
                value,
                onChange: (e) => onChange(e.target.value),
                rows: 4,
                placeholder: "Ask anything (location, timing, eligibility, etc.)",
                className:
                  "w-full rounded-2xl border border-white/60 bg-white/90 px-3 py-2 text-sm text-neutral-900 shadow-sm backdrop-blur"
              })
            ),
            h(
              "div",
              { className: "mt-3 flex gap-2" },
              h(
                Button,
                { type: "button", variant: "subtle", className: "flex-1", onClick: onClose },
                "Cancel"
              ),
              h(
                Button,
                { type: "button", className: "flex-1", disabled: busy, onClick: onSend },
                busy ? "Sending..." : "Send"
              )
            )
          )
        )
      : null
  );
}

function EventCard({ e, actionLabel, onAction, onOpen, onQuery, showQuery }) {
  return h(
    "div",
    { className: "overflow-hidden rounded-2xl border border-white/60 bg-white/70 shadow-sm backdrop-blur" },
    h("div", { className: "h-1 w-full bg-gradient-to-r from-indigo-600 to-cyan-500" }),
    h(
      "button",
      { type: "button", onClick: onOpen, className: "w-full text-left px-4 py-3 active:bg-white/60" },
      h(
        "div",
        { className: "flex items-start justify-between gap-3" },
        h("div", { className: "text-sm font-semibold text-neutral-900" }, e.title),
        showQuery
          ? h(
              motion.button,
              {
                type: "button",
                whileTap: { scale: 0.96 },
                title: "Raise a query",
                onClick: (ev) => {
                  ev.preventDefault();
                  ev.stopPropagation();
                  onQuery && onQuery();
                },
                className:
                  "mt-0.5 rounded-xl bg-white/70 p-2 text-indigo-700 shadow-sm active:bg-white"
              },
              h(Icon, { d: "M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" })
            )
          : null
      ),
      h("div", { className: "mt-1 text-xs text-neutral-600" }, `${fmtDateTime(e.startDate)} - ${fmtDateTime(e.endDate)}`),
      e.location ? h("div", { className: "mt-1 text-xs text-neutral-600" }, e.location) : null,
      e.contact ? h("div", { className: "mt-1 text-xs text-neutral-600" }, `Contact: ${e.contact}`) : null,
      e.requiredSkills && e.requiredSkills.length
        ? h(
            "div",
            { className: "mt-2 flex flex-wrap gap-1" },
            ...e.requiredSkills.slice(0, 4).map((s) => h(SkillTag, { key: s, text: labelForSkill(s) }))
          )
        : h("div", { className: "mt-2 text-xs text-neutral-600" }, "Skills: Any")
    ),
    onAction
      ? h(
          "div",
          { className: "px-4 pb-4" },
          h(Button, { variant: "primary", className: "w-full", onClick: onAction }, actionLabel)
        )
      : null
  );
}

export function EventsPage() {
  const user = useAuthStore((s) => s.user);
  const isNgo = user && user.role === "ngo";

  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToastStore((s) => s.push);

  const [view, setView] = React.useState("list");
  const [q, setQ] = React.useState("");

  const qEvents = useQuery({
    queryKey: ["events", { q }],
    queryFn: () => listEvents({ q, page: 1, limit: 100 })
  });

  const qRecommended = useQuery({
    queryKey: ["events", "recommended"],
    queryFn: recommendedEvents,
    enabled: !isNgo
  });

  const items = qEvents.data?.items || [];

  const calendarEvents = items.map((e) => ({
    id: e._id,
    title: e.title,
    start: new Date(e.startDate),
    end: new Date(e.endDate)
  }));

  const [showCreate, setShowCreate] = React.useState(false);

  React.useEffect(() => {
    if (showCreate) {
      try {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch {
        // ignore
      }
    }
  }, [showCreate]);
  const [title, setTitle] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [contact, setContact] = React.useState("");
  const [restrGender, setRestrGender] = React.useState("any");
  const [restrMinAge, setRestrMinAge] = React.useState("");
  const [restrMaxAge, setRestrMaxAge] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [requiredVolunteers, setRequiredVolunteers] = React.useState("1");
  const [requiredSkills, setRequiredSkills] = React.useState([NONE_SKILL]);
  const [error, setError] = React.useState("");

  const [queryOpen, setQueryOpen] = React.useState(false);
  const [queryEvent, setQueryEvent] = React.useState(null);
  const [queryMsg, setQueryMsg] = React.useState("");

  const mCreate = useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
      setShowCreate(false);
      setTitle("");
      setLocation("");
      setContact("");
      setRestrGender("any");
      setRestrMinAge("");
      setRestrMaxAge("");
      setStartDate("");
      setEndDate("");
      setRequiredVolunteers("1");
      setRequiredSkills([NONE_SKILL]);
      toast({ message: "Event created - matching volunteers notified", tone: "success" });
    },
    onError: (e) => setError(e?.response?.data?.error?.message || "Failed to create event")
  });

  const mInterest = useMutation({
    mutationFn: (eventId) => interestInEvent(eventId),
    onSuccess: () => toast({ message: "Sent to NGO - they'll contact you if needed", tone: "success" }),
    onError: () => toast({ message: "Couldn't send interest", tone: "error" })
  });

  const mQuery = useMutation({
    mutationFn: ({ eventId, message }) => raiseQuery(eventId, { message }),
    onSuccess: () => {
      toast({ message: "Query sent to the NGO", tone: "success" });
      setQueryOpen(false);
      setQueryEvent(null);
      setQueryMsg("");
    },
    onError: () => toast({ message: "Couldn't send query", tone: "error" })
  });

  function openEvent(id) {
    navigate(`/app/events/${id}`);
  }

  function openQueryFor(e) {
    setQueryEvent(e);
    setQueryMsg("");
    setQueryOpen(true);
  }

  function onChangeRequiredSkills(next) {
    const arr = Array.isArray(next) ? next : [];
    const hasNone = arr.some((o) => o.value === NONE_SKILL.value);
    const cleaned = hasNone && arr.length > 1 ? arr.filter((o) => o.value !== NONE_SKILL.value) : arr;
    setRequiredSkills(cleaned.length ? cleaned : [NONE_SKILL]);
  }

  function submitCreate(e) {
    e.preventDefault();
    setError("");
    const reqSkills = requiredSkills.some((o) => o.value === NONE_SKILL.value)
      ? []
      : requiredSkills.map((o) => o.value);

    const payload = {
      title,
      location,
      contact,
      restrictions: {
        gender: restrGender,
        minAge: restrMinAge ? Number(restrMinAge) : null,
        maxAge: restrMaxAge ? Number(restrMaxAge) : null
      },
      description: "",
      startDate: fromLocalInputValue(startDate),
      endDate: fromLocalInputValue(endDate),
      requiredVolunteers: Number(requiredVolunteers || 1),
      requiredSkills: reqSkills,
      shifts: []
    };

    mCreate.mutate(payload);
  }

  const recommended = qRecommended.data?.recommended || [];

  const startIso = fromLocalInputValue(startDate);
  const endIso = fromLocalInputValue(endDate);

  const portalTarget = typeof document !== "undefined" ? document.body : null;

  return h(
    "div",
    { className: "space-y-4" },

    h(
      "div",
      { className: "flex items-center justify-between" },
      h("div", { className: "text-base font-semibold text-neutral-900" }, "Events"),
      h(
        "div",
        { className: "flex items-center gap-2" },
        h(Button, { variant: "subtle", onClick: () => setView(view === "list" ? "calendar" : "list") }, view === "list" ? "Calendar" : "List"),
        isNgo ? h(Button, { variant: "primary", onClick: () => setShowCreate((v) => !v) }, showCreate ? "Close" : "New") : null
      )
    ),

    h(QuerySheet, {
      open: queryOpen,
      eventTitle: queryEvent?.title || "",
      value: queryMsg,
      onChange: setQueryMsg,
      onClose: () => {
        setQueryOpen(false);
        setQueryEvent(null);
        setQueryMsg("");
      },
      onSend: () => {
        if (!queryEvent?._id) return;
        const msg = String(queryMsg || "").trim();
        if (!msg) {
          toast({ message: "Write a message first", tone: "error" });
          return;
        }
        mQuery.mutate({ eventId: queryEvent._id, message: msg });
      },
      busy: mQuery.isPending
    }),

    !isNgo && recommended.length
      ? h(
          "div",
          { className: "space-y-2" },
          h(
            "div",
            { className: "flex items-center justify-between" },
            h("div", { className: "text-sm font-semibold text-neutral-900" }, "Recommended for you"),
            h("div", { className: "text-xs text-neutral-600" }, "Based on skills + availability")
          ),
          ...recommended.map((r) =>
            h(EventCard, {
              key: r.event._id,
              e: r.event,
              showQuery: true,
              onQuery: () => openQueryFor(r.event),
              actionLabel: "I'm interested",
              onAction: () => mInterest.mutate(r.event._id),
              onOpen: () => openEvent(r.event._id)
            })
          )
        )
      : null,

    h(Input, { value: q, onChange: (e) => setQ(e.target.value), placeholder: "Search events..." }),

    showCreate
      ? h(
          "form",
          { onSubmit: submitCreate, className: "rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur space-y-3" },
          h("div", { className: "text-sm font-semibold text-neutral-900" }, "Create event"),
          h("div", null, h(Label, null, "Title"), h(Input, { value: title, onChange: (e) => setTitle(e.target.value), required: true })),
          h("div", null, h(Label, null, "Location"), h(Input, { value: location, onChange: (e) => setLocation(e.target.value) })),
          h("div", null, h(Label, null, "Contact for queries"), h(Input, { value: contact, onChange: (e) => setContact(e.target.value), placeholder: "Phone or email" })),
          h(
            "div",
            { className: "rounded-2xl border border-white/60 bg-white/60 p-3 shadow-sm backdrop-blur" },
            h("div", { className: "text-xs font-semibold text-neutral-900" }, "Restrictions (optional)"),
            h("div", { className: "mt-1 text-xs text-neutral-600" }, "Leave as Any / blank for no restrictions."),
            h(
              "div",
              { className: "mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3" },
              h(
                "div",
                null,
                h("div", { className: "mb-1 text-xs font-medium text-neutral-700" }, "Gender"),
                h(
                  "select",
                  {
                    value: restrGender,
                    onChange: (e) => setRestrGender(e.target.value),
                    className: "w-full rounded-xl border border-white/60 bg-white/90 px-3 py-2 text-sm shadow-sm"
                  },
                  ...[
                    { v: "any", l: "Any" },
                    { v: "male", l: "Male" },
                    { v: "female", l: "Female" },
                    { v: "other", l: "Other" },
                    { v: "prefer_not_say", l: "Prefer not to say" }
                  ].map((o) => h("option", { key: o.v, value: o.v }, o.l))
                )
              ),
              h(
                "div",
                null,
                h("div", { className: "mb-1 text-xs font-medium text-neutral-700" }, "Min age"),
                h(Input, { inputMode: "numeric", value: restrMinAge, onChange: (e) => setRestrMinAge(e.target.value), placeholder: "None" })
              ),
              h(
                "div",
                null,
                h("div", { className: "mb-1 text-xs font-medium text-neutral-700" }, "Max age"),
                h(Input, { inputMode: "numeric", value: restrMaxAge, onChange: (e) => setRestrMaxAge(e.target.value), placeholder: "Any" })
              )
            )
          ),
          h(
            "div",
            { className: "grid grid-cols-1 gap-3" },
            h(
              "div",
              null,
              h(Label, null, "Start"),
              h(Input, { type: "datetime-local", value: startDate, onChange: (e) => setStartDate(e.target.value), onFocus: ensureInputVisible, required: true }),
              startIso ? h("div", { className: "mt-1 text-xs text-neutral-600" }, `AM/PM: ${fmtDateTime(startIso)}`) : null
            ),
            h(
              "div",
              null,
              h(Label, null, "End"),
              h(Input, { type: "datetime-local", value: endDate, onChange: (e) => setEndDate(e.target.value), onFocus: ensureInputVisible, required: true }),
              endIso ? h("div", { className: "mt-1 text-xs text-neutral-600" }, `AM/PM: ${fmtDateTime(endIso)}`) : null
            )
          ),
          h(
            "div",
            { className: "grid grid-cols-1 gap-3 sm:grid-cols-2" },
            h("div", null, h(Label, null, "Volunteers"), h(Input, { inputMode: "numeric", value: requiredVolunteers, onChange: (e) => setRequiredVolunteers(e.target.value) })),
            h(
              "div",
              { className: "min-w-0" },
              h(Label, null, "Required skills"),
              h(Select, {
                isMulti: true,
                options: EVENT_SKILL_OPTIONS,
                value: requiredSkills,
                onChange: onChangeRequiredSkills,
                placeholder: "Select skills (optional)",
                styles: selectStyles(),
                menuPortalTarget: portalTarget,
                menuPosition: "fixed"
              })
            )
          ),
          error ? h("div", { className: "text-sm text-red-600" }, error) : null,
          h(Button, { type: "submit", disabled: mCreate.isPending, className: "w-full" }, mCreate.isPending ? "Creating..." : "Create")
        )
      : null,

    qEvents.isLoading
      ? h(
          "div",
          { className: "space-y-2" },
          ...Array.from({ length: 6 }).map((_, i) => h("div", { key: i, className: "h-20 rounded-2xl bg-white/60 animate-pulse" }))
        )
      : null,

    qEvents.isError ? h("div", { className: "text-sm text-red-600" }, "Failed to load events") : null,

    view === "list"
      ? h(
          "div",
          { className: "space-y-2" },
          items.length
            ? items.map((e) =>
                h(EventCard, {
                  key: e._id,
                  e,
                  showQuery: !isNgo,
                  onQuery: !isNgo ? () => openQueryFor(e) : null,
                  actionLabel: !isNgo ? "I'm interested" : null,
                  onAction: !isNgo ? () => mInterest.mutate(e._id) : null,
                  onOpen: () => openEvent(e._id)
                })
              )
            : h("div", { className: "px-3 py-10 text-center text-sm text-neutral-600" }, "No events")
        )
      : h(
          "div",
          { className: "overflow-hidden rounded-2xl border border-white/60 bg-white/70 shadow-sm backdrop-blur" },
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
