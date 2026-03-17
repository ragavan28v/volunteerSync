import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { h } from "../utils/h";
import { useAuthStore } from "../store/authStore";
import { getMyVolunteerProfile, updateMyVolunteerProfile } from "../services/api/volunteersApi";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { Hint } from "../components/ui/Hint";
import { skillsToArray } from "../utils/format";

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function AvailabilityRow({ slot, onRemove }) {
  return h(
    "div",
    { className: "flex items-center justify-between px-3 py-2" },
    h("div", { className: "text-sm" }, `${days[slot.dayOfWeek]} · ${slot.startTime}–${slot.endTime}`),
    h(Button, { variant: "ghost", onClick: onRemove }, "Remove")
  );
}

export function ProfilePage() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user && user.role === "admin";

  const qProfile = useQuery({
    queryKey: ["volunteer", "me"],
    queryFn: getMyVolunteerProfile,
    enabled: !isAdmin
  });

  const [skillsText, setSkillsText] = React.useState("");
  const [dayOfWeek, setDayOfWeek] = React.useState("1");
  const [startTime, setStartTime] = React.useState("09:00");
  const [endTime, setEndTime] = React.useState("12:00");
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (qProfile.data?.volunteer?.skills) {
      setSkillsText(qProfile.data.volunteer.skills.join(", "));
    }
  }, [qProfile.data]);

  const mSave = useMutation({
    mutationFn: updateMyVolunteerProfile,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["volunteer", "me"] });
      setError("");
    },
    onError: (e) => setError(e?.response?.data?.error?.message || "Failed to save")
  });

  function addSlot() {
    const current = qProfile.data?.volunteer?.availability || [];
    const slot = { dayOfWeek: Number(dayOfWeek), startTime, endTime };
    mSave.mutate({
      skills: skillsToArray(skillsText),
      availability: current.concat([slot])
    });
  }

  function removeSlot(idx) {
    const current = qProfile.data?.volunteer?.availability || [];
    const next = current.filter((_, i) => i !== idx);
    mSave.mutate({ skills: skillsToArray(skillsText), availability: next });
  }

  function saveSkills() {
    const current = qProfile.data?.volunteer?.availability || [];
    mSave.mutate({ skills: skillsToArray(skillsText), availability: current });
  }

  if (isAdmin) {
    return h(
      "div",
      { className: "space-y-4" },
      h("div", { className: "text-base font-semibold" }, "Admin"),
      h("div", { className: "text-sm text-neutral-600" }, "Manage volunteers, hours, and assignments."),
      h(
        "div",
        { className: "divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white" },
        h(
          Link,
          { to: "/app/admin/volunteers", className: "block px-3 py-3 text-sm active:bg-neutral-50" },
          "Volunteer directory"
        ),
        h(
          Link,
          { to: "/app/admin/hours", className: "block px-3 py-3 text-sm active:bg-neutral-50" },
          "Verify hours"
        )
      )
    );
  }

  const volunteer = qProfile.data?.volunteer;

  return h(
    "div",
    { className: "space-y-6" },
    h("div", { className: "text-base font-semibold" }, "Profile"),
    h("div", { className: "text-sm text-neutral-600" }, user ? `${user.name} · ${user.email}` : ""),
    error ? h("div", { className: "text-sm text-red-600" }, error) : null,

    h(
      "div",
      { className: "space-y-3" },
      h("div", { className: "text-sm font-medium text-neutral-700" }, "Skills"),
      h(Label, null, "Comma-separated"),
      h(Input, { value: skillsText, onChange: (e) => setSkillsText(e.target.value), placeholder: "first-aid, logistics" }),
      h(
        Button,
        { variant: "primary", onClick: saveSkills, disabled: mSave.isPending, className: "w-full" },
        mSave.isPending ? "Saving…" : "Save"
      )
    ),

    h(
      "div",
      { className: "space-y-3" },
      h("div", { className: "text-sm font-medium text-neutral-700" }, "Availability"),
      h(Hint, null, "Add time windows you are usually available."),
      h(
        "div",
        { className: "grid grid-cols-3 gap-2" },
        h(
          "select",
          {
            value: dayOfWeek,
            onChange: (e) => setDayOfWeek(e.target.value),
            className: "rounded-md border border-neutral-200 bg-white px-2 py-2 text-sm"
          },
          ...days.map((d, i) => h("option", { key: i, value: String(i) }, d))
        ),
        h(Input, { type: "time", value: startTime, onChange: (e) => setStartTime(e.target.value) }),
        h(Input, { type: "time", value: endTime, onChange: (e) => setEndTime(e.target.value) })
      ),
      h(Button, { variant: "subtle", onClick: addSlot, disabled: mSave.isPending, className: "w-full" }, "Add slot"),
      h(
        "div",
        { className: "divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white" },
        volunteer && volunteer.availability && volunteer.availability.length
          ? volunteer.availability.map((slot, idx) => h(AvailabilityRow, { key: idx, slot, onRemove: () => removeSlot(idx) }))
          : h("div", { className: "px-3 py-8 text-center text-sm text-neutral-500" }, "No availability yet")
      )
    )
  );
}
