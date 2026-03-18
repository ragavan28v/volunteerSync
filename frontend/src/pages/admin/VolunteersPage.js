import React from "react";
import { useQuery } from "@tanstack/react-query";
import Select from "react-select";

import { h } from "../../utils/h";
import { listVolunteers } from "../../services/api/volunteersApi";
import { Input } from "../../components/ui/Input";
import { SKILL_OPTIONS, labelForSkill } from "../../utils/skills";
import { fmtHours } from "../../utils/format";

function selectStyles() {
  return {
    control: (base, state) => ({
      ...base,
      borderRadius: 12,
      borderColor: state.isFocused ? "#94a3b8" : "#e2e8f0",
      boxShadow: "none",
      minHeight: 42,
      backgroundColor: "rgba(255,255,255,0.9)"
    })
  };
}

function Row({ v }) {
  const u = v.user;
  return h(
    "div",
    { className: "px-4 py-3" },
    h(
      "div",
      { className: "flex items-center justify-between" },
      h(
        "div",
        null,
        h("div", { className: "text-sm font-semibold text-neutral-900" }, u?.name || "Volunteer"),
        h("div", { className: "mt-0.5 text-xs text-neutral-600" }, u?.email || "")
      ),
      h(
        "div",
        { className: "rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-neutral-900" },
        `${fmtHours(v.totalHours || 0)}`
      )
    ),
    v.skills && v.skills.length
      ? h(
          "div",
          { className: "mt-2 text-xs text-neutral-600" },
          `Skills: ${v.skills.slice(0, 8).map(labelForSkill).join(", ")}`
        )
      : null
  );
}

export function VolunteersPage() {
  const portalTarget = typeof document !== "undefined" ? document.body : null;
  const [q, setQ] = React.useState("");
  const [skillOpt, setSkillOpt] = React.useState(null);

  const skill = skillOpt?.value || "";

  const query = useQuery({
    queryKey: ["admin", "volunteers", { q, skill }],
    queryFn: () => listVolunteers({ q, skill, page: 1, limit: 50 })
  });

  const items = query.data?.items || [];

  return h(
    "div",
    { className: "space-y-4" },
    h("div", { className: "text-base font-semibold text-neutral-900" }, "Volunteer directory"),
    h(Input, { value: q, onChange: (e) => setQ(e.target.value), placeholder: "Search name/email..." }),
    h(
      "div",
      null,
      h("div", { className: "mb-1 text-xs font-medium text-neutral-700" }, "Filter by skill (optional)"),
      h(Select, {
        isClearable: true,
        options: SKILL_OPTIONS,
        value: skillOpt,
        onChange: (v) => setSkillOpt(v || null),
        placeholder: "All skills",
        styles: selectStyles(),
        menuPortalTarget: portalTarget,
        menuPosition: "fixed"
      })
    ),

    query.isLoading
      ? h(
          "div",
          { className: "space-y-2" },
          ...Array.from({ length: 6 }).map((_, i) => h("div", { key: i, className: "h-16 rounded-2xl bg-white/60 animate-pulse" }))
        )
      : null,

    query.isError ? h("div", { className: "text-sm text-rose-600" }, "Failed to load volunteers") : null,

    h(
      "div",
      { className: "divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-white/60 bg-white/70 shadow-sm backdrop-blur" },
      items.length
        ? items.map((v) => h(Row, { key: v._id, v }))
        : h("div", { className: "px-4 py-10 text-center text-sm text-neutral-700" }, "No volunteers")
    )
  );
}
