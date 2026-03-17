import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { h } from "../utils/h";
import { useAuthStore } from "../store/authStore";
import { getOverview } from "../services/api/analyticsApi";
import { getMyVolunteerProfile } from "../services/api/volunteersApi";
import { listMyAssignments } from "../services/api/assignmentsApi";
import { downloadVolunteersCsv } from "../services/api/reportsApi";
import { Button } from "../components/ui/Button";

function Stat({ label, value }) {
  return h(
    "div",
    { className: "flex items-baseline justify-between py-3" },
    h("div", { className: "text-sm text-neutral-600" }, label),
    h("div", { className: "text-lg font-semibold" }, value)
  );
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  const isAdmin = user && user.role === "admin";

  const qAdmin = useQuery({
    queryKey: ["analytics", "overview"],
    queryFn: getOverview,
    enabled: isAdmin
  });

  const qVolunteerProfile = useQuery({
    queryKey: ["volunteer", "me"],
    queryFn: getMyVolunteerProfile,
    enabled: !isAdmin
  });

  const qMyAssignments = useQuery({
    queryKey: ["assignments", "my"],
    queryFn: listMyAssignments,
    enabled: !isAdmin
  });

  const [exporting, setExporting] = React.useState(false);
  const [exportError, setExportError] = React.useState("");

  async function exportCsv() {
    try {
      setExportError("");
      setExporting(true);
      const blob = await downloadVolunteersCsv();
      downloadBlob(blob, "volunteers.csv");
    } catch (e) {
      setExportError("CSV export failed");
    } finally {
      setExporting(false);
    }
  }

  if (isAdmin) {
    const data = qAdmin.data;
    const totals = data?.totals;

    return h(
      "div",
      { className: "space-y-6" },
      h("div", { className: "text-base font-semibold" }, "Dashboard"),
      h(
        "div",
        { className: "divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white" },
        h(Stat, { label: "Total volunteers", value: totals ? totals.volunteers : "…" }),
        h(Stat, { label: "Active events", value: totals ? totals.activeEvents : "…" }),
        h(Stat, {
          label: "Verified hours served",
          value: totals ? Math.round(totals.totalHours * 10) / 10 : "…"
        })
      ),
      h(
        "div",
        null,
        h("div", { className: "text-sm font-medium text-neutral-700" }, "Top contributors"),
        h(
          "div",
          {
            className:
              "mt-2 divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white"
          },
          ...(data?.topContributors || []).map((t) =>
            h(
              "div",
              { key: t.volunteerId, className: "flex items-center justify-between px-3 py-3" },
              h(
                "div",
                null,
                h("div", { className: "text-sm font-medium" }, t.user?.name || "Volunteer"),
                h("div", { className: "text-xs text-neutral-500" }, t.user?.email || "")
              ),
              h("div", { className: "text-sm font-semibold" }, `${t.totalHours}h`)
            )
          )
        )
      ),
      h(
        "div",
        { className: "flex flex-wrap gap-4 items-center" },
        h(Link, { to: "/app/admin/volunteers", className: "text-sm underline" }, "Manage volunteers"),
        h(Link, { to: "/app/admin/hours", className: "text-sm underline" }, "Verify hours"),
        h(Button, { variant: "subtle", onClick: exportCsv, disabled: exporting }, exporting ? "Exporting…" : "Export CSV")
      ),
      exportError ? h("div", { className: "text-sm text-red-600" }, exportError) : null,
      qAdmin.isError ? h("div", { className: "text-sm text-red-600" }, "Failed to load analytics") : null
    );
  }

  const totalHours = qVolunteerProfile.data?.volunteer?.totalHours;
  const assignmentsCount = qMyAssignments.data?.items?.length;

  return h(
    "div",
    { className: "space-y-6" },
    h("div", { className: "text-base font-semibold" }, "Your overview"),
    h(
      "div",
      { className: "divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white" },
      h(Stat, { label: "Total verified hours", value: typeof totalHours === "number" ? totalHours : "…" }),
      h(Stat, { label: "Your assignments", value: typeof assignmentsCount === "number" ? assignmentsCount : "…" })
    ),
    h(
      "div",
      { className: "text-sm text-neutral-600" },
      "Tip: Keep your skills and availability updated for better shift matching."
    )
  );
}
