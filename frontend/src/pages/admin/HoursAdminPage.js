import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { h } from "../../utils/h";
import { listHours, verifyHours } from "../../services/api/hoursApi";
import { Button } from "../../components/ui/Button";

function Row({ r, onVerify, isBusy }) {
  return h(
    "div",
    { className: "flex items-center justify-between px-3 py-3" },
    h(
      "div",
      null,
      h("div", { className: "text-sm font-medium" }, `${r.hours}h`),
      h("div", { className: "mt-0.5 text-xs text-neutral-500" }, `Volunteer: ${r.volunteerId}`),
      h("div", { className: "mt-0.5 text-xs text-neutral-500" }, `Event: ${r.eventId}`)
    ),
    h(
      Button,
      { variant: r.verified ? "subtle" : "primary", onClick: () => onVerify(r._id, !r.verified), disabled: isBusy },
      r.verified ? "Unverify" : "Verify"
    )
  );
}

export function HoursAdminPage() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["admin", "hours", { verified: false }],
    queryFn: () => listHours({ page: 1, limit: 50, verified: "false" })
  });

  const m = useMutation({
    mutationFn: ({ id, verified }) => verifyHours(id, verified),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "hours"] });
      qc.invalidateQueries({ queryKey: ["analytics", "overview"] });
    }
  });

  const items = query.data?.items || [];

  return h(
    "div",
    { className: "space-y-4" },
    h("div", { className: "text-base font-semibold" }, "Verify hours"),
    query.isError ? h("div", { className: "text-sm text-red-600" }, "Failed to load hours") : null,
    h(
      "div",
      { className: "divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white" },
      items.length
        ? items.map((r) =>
            h(Row, { key: r._id, r, isBusy: m.isPending, onVerify: (id, verified) => m.mutate({ id, verified }) })
          )
        : h("div", { className: "px-3 py-10 text-center text-sm text-neutral-500" }, query.isLoading ? "Loading…" : "No pending records")
    )
  );
}
