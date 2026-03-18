import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import Select from "react-select";

import { h } from "../utils/h";
import { useAuthStore } from "../store/authStore";
import { me } from "../services/api/authApi";
import { getMyVolunteerProfile, updateMyVolunteerProfile } from "../services/api/volunteersApi";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Hint } from "../components/ui/Hint";
import { SKILL_OPTIONS, labelForSkill } from "../utils/skills";

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

function selectStyles() {
  return {
    control: (base, state) => ({
      ...base,
      borderRadius: 12,
      borderColor: state.isFocused ? "#6366f1" : "#e2e8f0",
      boxShadow: "none",
      minHeight: 44,
      backgroundColor: "rgba(255,255,255,0.92)"
    }),
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

function ProfileHeader({ name, email, role, metaLines }) {
  const roleLabel = role === "ngo" ? "NGO" : role === "volunteer" ? "Volunteer" : "";
  return h(
    "div",
    { className: "overflow-hidden rounded-2xl border border-white/60 bg-white/70 shadow-sm backdrop-blur" },
    h("div", { className: "h-1 w-full bg-gradient-to-r from-indigo-600 to-cyan-500" }),
    h(
      "div",
      { className: "flex items-center gap-3 p-4" },
      h(
        "div",
        {
          className: [
            "h-12 w-12 rounded-2xl text-white shadow-sm",
            "bg-gradient-to-br",
            avatarTone(`${name}-${role}`),
            "flex items-center justify-center"
          ].join(" ")
        },
        h("div", { className: "text-sm font-bold tracking-wide" }, getInitials(name))
      ),
      h(
        "div",
        { className: "min-w-0 flex-1" },
        h(
          "div",
          { className: "flex items-center gap-2" },
          h("div", { className: "text-sm font-semibold text-neutral-900 truncate" }, name || ""),
          roleLabel
            ? h(
                "span",
                { className: "rounded-full bg-indigo-500/10 px-2 py-0.5 text-[11px] font-semibold text-indigo-700" },
                roleLabel
              )
            : null
        ),
        email ? h("div", { className: "mt-0.5 text-xs text-neutral-600 truncate" }, email) : null,
        metaLines && metaLines.length
          ? h(
              "div",
              { className: "mt-2 flex flex-wrap gap-2" },
              ...metaLines.map((t) =>
                h(
                  "span",
                  { key: t, className: "rounded-full bg-slate-500/10 px-2 py-0.5 text-[11px] font-medium text-neutral-800" },
                  t
                )
              )
            )
          : null
      )
    )
  );
}

function Chip({ text }) {
  return h(
    "span",
    {
      className:
        "inline-flex items-center rounded-full bg-cyan-500/10 px-2 py-0.5 text-[11px] font-medium text-neutral-900"
    },
    text
  );
}

function ActionRow({ to, title, subtitle, tone, icon }) {
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
      className: "group flex items-center gap-3 px-4 py-3 active:bg-white/60"
    },
    h(
      "div",
      {
        className:
          `h-10 w-10 rounded-2xl bg-gradient-to-br ${strip} text-white flex items-center justify-center shadow-sm`
      },
      h(Icon, { d: icon, className: "h-5 w-5" })
    ),
    h(
      "div",
      { className: "min-w-0 flex-1" },
      h("div", { className: "text-sm font-semibold text-neutral-900" }, title),
      subtitle
        ? h("div", { className: "mt-0.5 text-xs text-neutral-600 truncate" }, subtitle)
        : null
    ),
    h(
      "div",
      { className: "text-neutral-400" },
      h(Icon, { d: "M9 18l6-6-6-6", className: "h-5 w-5" })
    )
  );
}

export function ProfilePage() {
  const portalTarget = typeof document !== "undefined" ? document.body : null;

  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isNgo = user && user.role === "ngo";

  const qMe = useQuery({
    queryKey: ["auth", "me"],
    queryFn: me
  });

  const qProfile = useQuery({
    queryKey: ["volunteer", "me"],
    queryFn: getMyVolunteerProfile,
    enabled: !isNgo
  });

  const volunteer = qProfile.data?.volunteer;

  const [selected, setSelected] = React.useState([]);
  React.useEffect(() => {
    if (!volunteer?.skills) return;
    const map = new Map(SKILL_OPTIONS.map((o) => [o.value, o]));
    setSelected(volunteer.skills.map((v) => map.get(v) || { value: v, label: labelForSkill(v) }));
  }, [volunteer]);

  const [dayOfWeek, setDayOfWeek] = React.useState("1");
  const [startTime, setStartTime] = React.useState("09:00");
  const [endTime, setEndTime] = React.useState("12:00");
  const [error, setError] = React.useState("");

  const mSave = useMutation({
    mutationFn: updateMyVolunteerProfile,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["volunteer", "me"] });
      setError("");
    },
    onError: (e) => setError(e?.response?.data?.error?.message || "Failed to save")
  });

  function saveSkills(nextSelected) {
    const skills = (nextSelected || []).map((o) => o.value);
    const availability = volunteer?.availability || [];
    mSave.mutate({ skills, availability });
  }

  function addSlot() {
    const current = volunteer?.availability || [];
    const slot = { dayOfWeek: Number(dayOfWeek), startTime, endTime };
    mSave.mutate({ skills: selected.map((o) => o.value), availability: current.concat([slot]) });
  }

  function removeSlot(idx) {
    const current = volunteer?.availability || [];
    const next = current.filter((_, i) => i !== idx);
    mSave.mutate({ skills: selected.map((o) => o.value), availability: next });
  }

  if (isNgo) {
    const ngo = qMe.data?.ngo;
    return h(
      "div",
      { className: "space-y-4" },
      h("div", { className: "text-base font-semibold text-neutral-900" }, "NGO profile"),

      h(ProfileHeader, {
        name: ngo?.organizationName || user?.name || "NGO",
        email: user?.email || ngo?.email || "",
        role: "ngo",
        metaLines: [ngo?.type, ngo?.location].filter(Boolean)
      }),

      h(
        "div",
        { className: "overflow-hidden rounded-2xl border border-white/60 bg-white/70 shadow-sm backdrop-blur divide-y divide-white/60" },
        h(ActionRow, {
          to: "/app/events",
          title: "Manage events",
          subtitle: "Shifts + required skills",
          tone: "indigo",
          icon: "M8 7V4m8 3V4M5 10h14M6 20h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2Z"
        }),
        h(ActionRow, {
          to: "/app/admin/volunteers",
          title: "Volunteer directory",
          subtitle: "Filter by skill and hours",
          tone: "violet",
          icon: "M20 21a8 8 0 1 0-16 0M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
        }),
        h(ActionRow, {
          to: "/app/admin/hours",
          title: "Verify hours",
          subtitle: "Approve submissions",
          tone: "cyan",
          icon: "M9 12h6m-5 8h4a2 2 0 0 0 2-2V7l-3-3H8a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z"
        })
      )
    );
  }

  return h(
    "div",
    { className: "space-y-5" },
    h("div", { className: "text-base font-semibold text-neutral-900" }, "Your profile"),
    h(ProfileHeader, {
      name: user?.name || "Volunteer",
      email: user?.email || "",
      role: "volunteer",
      metaLines: [
        volunteer?.gender ? `Gender: ${volunteer.gender}` : null,
        volunteer?.age ? `Age: ${volunteer.age}` : null
      ].filter(Boolean)
    }),
    error ? h("div", { className: "text-sm text-rose-600" }, error) : null,

    h(
      "div",
      { className: "rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur" },
      h("div", { className: "text-sm font-semibold text-neutral-900" }, "Skills"),
      h(
        "div",
        { className: "mt-2" },
        h(Select, {
          isMulti: true,
          options: SKILL_OPTIONS,
          value: selected,
          onChange: (v) => {
            setSelected(v || []);
            saveSkills(v || []);
          },
          placeholder: "Search skills...",
          styles: selectStyles(),
          menuPortalTarget: portalTarget,
          menuPosition: "fixed"
        })
      ),
      volunteer?.skills?.length
        ? h(
            "div",
            { className: "mt-3 flex flex-wrap gap-1" },
            ...volunteer.skills.slice(0, 12).map((v) => h(Chip, { key: v, text: labelForSkill(v) }))
          )
        : h("div", { className: "mt-3 text-sm text-neutral-600" }, "Add your skills to get better matches")
    ),

    h(
      "div",
      { className: "rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur" },
      h("div", { className: "text-sm font-semibold text-neutral-900" }, "Availability"),
      h(Hint, null, "Add time windows you are usually available."),
      h(
        "div",
        { className: "mt-3 grid grid-cols-3 gap-2" },
        h(
          "select",
          {
            value: dayOfWeek,
            onChange: (e) => setDayOfWeek(e.target.value),
            className: "rounded-xl border border-white/60 bg-white/80 px-2 py-2 text-sm shadow-sm backdrop-blur"
          },
          ...days.map((d, i) => h("option", { key: i, value: String(i) }, d))
        ),
        h(Input, { type: "time", value: startTime, onChange: (e) => setStartTime(e.target.value) }),
        h(Input, { type: "time", value: endTime, onChange: (e) => setEndTime(e.target.value) })
      ),
      h(Button, { variant: "subtle", onClick: addSlot, disabled: mSave.isPending, className: "mt-2 w-full" }, "Add slot"),
      h(
        "div",
        { className: "mt-3 divide-y divide-neutral-200 rounded-xl border border-white/60 bg-white/70" },
        volunteer?.availability?.length
          ? volunteer.availability.map((slot, idx) =>
              h(
                "div",
                { key: idx, className: "flex items-center justify-between px-3 py-2" },
                h("div", { className: "text-sm text-neutral-900" }, `${days[slot.dayOfWeek]} - ${slot.startTime}-${slot.endTime}`),
                h(Button, { variant: "ghost", onClick: () => removeSlot(idx) }, "Remove")
              )
            )
          : h("div", { className: "px-3 py-3 text-sm text-neutral-600" }, "No availability yet")
      )
    )
  );
}
