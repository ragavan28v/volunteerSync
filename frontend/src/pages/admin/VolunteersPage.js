import React from "react";
import { useQuery } from "@tanstack/react-query";

import { h } from "../../utils/h";
import { listVolunteers } from "../../services/api/volunteersApi";
import { Input } from "../../components/ui/Input";

function Row({ v }) {
  const u = v.user;
  return h(
    "div",
    { className: "px-3 py-3" },
    h(
      "div",
      { className: "flex items-center justify-between" },
      h(
        "div",
        null,
        h("div", { className: "text-sm font-medium" }, u?.name || "Volunteer"),
        h("div", { className: "mt-0.5 text-xs text-neutral-500" }, u?.email || "")
      ),
      h("div", { className: "text-sm font-semibold" }, `${v.totalHours || 0}h`)
    ),
    v.skills && v.skills.length
      ? h("div", { className: "mt-1 text-xs text-neutral-500" }, `Skills: ${v.skills.join(", ")}`)
      : null
  );
}

export function VolunteersPage() {
  const [q, setQ] = React.useState("");
  const [skill, setSkill] = React.useState("");

  const query = useQuery({
    queryKey: ["admin", "volunteers", { q, skill }],
    queryFn: () => listVolunteers({ q, skill, page: 1, limit: 50 })
  });

  const items = query.data?.items || [];

  return h(
    "div",
    { className: "space-y-4" },
    h("div", { className: "text-base font-semibold" }, "Volunteers"),
    h(Input, { value: q, onChange: (e) => setQ(e.target.value), placeholder: "Search name/email…" }),
    h(Input, { value: skill, onChange: (e) => setSkill(e.target.value), placeholder: "Filter by skill (optional)…" }),

    query.isLoading
      ? h(
          "div",
          { className: "space-y-2" },
          ...Array.from({ length: 6 }).map((_, i) => h("div", { key: i, className: "h-14 bg-neutral-200 rounded animate-pulse" }))
        )
      : null,

    query.isError ? h("div", { className: "text-sm text-red-600" }, "Failed to load volunteers") : null,

    h(
      "div",
      { className: "divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white" },
      items.length
        ? items.map((v) => h(Row, { key: v._id, v }))
        : h("div", { className: "px-3 py-10 text-center text-sm text-neutral-500" }, "No volunteers")
    )
  );
}
