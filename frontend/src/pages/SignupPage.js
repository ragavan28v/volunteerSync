import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Select from "react-select";

import { h } from "../utils/h";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Label } from "../components/ui/Label";
import { Hint } from "../components/ui/Hint";
import { signup } from "../services/api/authApi";
import { useAuthStore } from "../store/authStore";
import { SKILL_OPTIONS } from "../utils/skills";

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function selectStyles() {
  return {
    control: (base, state) => ({
      ...base,
      borderRadius: 14,
      borderColor: state.isFocused ? "#6366f1" : "#e2e8f0",
      boxShadow: "none",
      minHeight: 46,
      backgroundColor: "rgba(255,255,255,0.95)"
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

function Icon({ d }) {
  return h(
    "svg",
    { viewBox: "0 0 24 24", fill: "none", className: "h-6 w-6" },
    h("path", {
      d,
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round"
    })
  );
}

function RoleCard({ title, subtitle, icon, onClick, tone }) {
  const toneClass =
    tone === "volunteer"
      ? "from-cyan-500/15 to-indigo-500/10"
      : "from-indigo-500/15 to-amber-400/10";

  return h(
    motion.button,
    {
      type: "button",
      onClick,
      whileTap: { scale: 0.98 },
      className: [
        "w-full rounded-2xl border border-white/60 bg-gradient-to-b p-4 text-left",
        "shadow-sm backdrop-blur",
        toneClass
      ].join(" ")
    },
    h(
      "div",
      { className: "flex items-start justify-between gap-4" },
      h(
        "div",
        { className: "min-w-0" },
        h("div", { className: "text-sm font-semibold text-neutral-900" }, title),
        h("div", { className: "mt-1 text-xs text-neutral-700" }, subtitle)
      ),
      h(
        "div",
        { className: "shrink-0 rounded-2xl bg-white/60 p-2 text-neutral-900" },
        h(Icon, { d: icon })
      )
    )
  );
}

export function SignupPage() {
  const portalTarget = typeof document !== "undefined" ? document.body : null;
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  const [role, setRole] = React.useState(""); // volunteer | ngo
  const [error, setError] = React.useState("");

  // Volunteer fields
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [gender, setGender] = React.useState("prefer_not_say");
  const [age, setAge] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [skillsSelected, setSkillsSelected] = React.useState([]);
  const [availability, setAvailability] = React.useState([]);

  const [dayOfWeek, setDayOfWeek] = React.useState("1");
  const [startTime, setStartTime] = React.useState("09:00");
  const [endTime, setEndTime] = React.useState("12:00");

  // NGO fields
  const [orgName, setOrgName] = React.useState("");
  const [ngoEmail, setNgoEmail] = React.useState("");
  const [ngoPhone, setNgoPhone] = React.useState("");
  const [ngoPassword, setNgoPassword] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [type, setType] = React.useState("Education");

  const m = useMutation({
    mutationFn: signup,
    onSuccess: (data) => {
      setSession({ accessToken: data.accessToken, user: data.user });
      navigate("/app", { replace: true });
    },
    onError: (e) => setError(e?.response?.data?.error?.message || "Signup failed")
  });

  function addSlot() {
    setAvailability((prev) => prev.concat([{ dayOfWeek: Number(dayOfWeek), startTime, endTime }]));
  }

  function removeSlot(idx) {
    setAvailability((prev) => prev.filter((_, i) => i !== idx));
  }

  function submitVolunteer(e) {
    e.preventDefault();
    setError("");
    m.mutate({
      role: "volunteer",
      name,
      email,
      phone,
      gender,
      age: age ? Number(age) : undefined,
      password,
      skills: skillsSelected.map((o) => o.value),
      availability
    });
  }

  function submitNgo(e) {
    e.preventDefault();
    setError("");
    m.mutate({
      role: "ngo",
      organizationName: orgName,
      email: ngoEmail,
      phone: ngoPhone,
      password: ngoPassword,
      location,
      description,
      type
    });
  }

  const pending = m.isPending;

  return h(
    "div",
    { className: "min-h-screen bg-gradient-to-b from-slate-50 to-blue-50" },
    h(
      "div",
      { className: "mx-auto w-full max-w-md px-4 py-10" },
      h(
        motion.div,
        {
          initial: { opacity: 0, y: 8 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.22 }
        },
        h("div", { className: "text-lg font-semibold text-neutral-900" }, "Create account"),
      ),

      error
        ? h(
            "div",
            { className: "mt-4 rounded-2xl border border-rose-200/60 bg-rose-500/10 px-3 py-2 text-sm text-rose-700" },
            error
          )
        : null,

      !role
        ? h(
            "div",
            { className: "mt-6 space-y-3" },
            h(
              "div",
              { className: "rounded-2xl border border-white/60 bg-white/70 p-3 shadow-sm backdrop-blur" },
              h(RoleCard, {
                title: "Join as Volunteer",
                subtitle: "Add skills and availability to get matched",
                tone: "volunteer",
                icon: "M12 6v6l4 2",
                onClick: () => setRole("volunteer")
              }),
              h("div", { className: "h-3" }),
              h(RoleCard, {
                title: "Register as NGO",
                subtitle: "Create events and coordinate shifts",
                tone: "ngo",
                icon: "M3 21V9l9-6 9 6v12",
                onClick: () => setRole("ngo")
              })
            ),
            h(
              Hint,
              null,
              h(
                "div",
                { className: "text-sm" },
                "Already have an account? ",
                h(Link, { className: "text-indigo-600 underline", to: "/login" }, "Sign in")
              )
            )
          )
        : null,

      role === "volunteer"
        ? h(
            "form",
            { onSubmit: submitVolunteer, className: "mt-6 space-y-4" },
            h(
              "div",
              { className: "rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur space-y-4" },
              h(
                "div",
                { className: "flex items-center justify-between" },
                h("div", { className: "text-sm font-semibold text-neutral-900" }, "Volunteer details"),
                h(
                  "button",
                  { type: "button", className: "text-xs text-neutral-700 underline", onClick: () => setRole("") },
                  "Change"
                )
              ),
              h("div", null, h(Label, null, "Name"), h(Input, { value: name, onChange: (e) => setName(e.target.value), required: true })),
              h("div", null, h(Label, null, "Email"), h(Input, { type: "email", value: email, onChange: (e) => setEmail(e.target.value), required: true })),
              h("div", null, h(Label, null, "Phone"), h(Input, { value: phone, onChange: (e) => setPhone(e.target.value) })),
              h(
                "div",
                { className: "grid grid-cols-2 gap-3" },
                h(
                  "div",
                  null,
                  h(Label, null, "Gender"),
                  h(
                    "select",
                    {
                      value: gender,
                      onChange: (e) => setGender(e.target.value),
                      className: "w-full rounded-xl border border-white/60 bg-white/80 px-3 py-2 text-sm shadow-sm backdrop-blur"
                    },
                    ...[
                      { v: "prefer_not_say", l: "Prefer not to say" },
                      { v: "male", l: "Male" },
                      { v: "female", l: "Female" },
                      { v: "other", l: "Other" }
                    ].map((o) => h("option", { key: o.v, value: o.v }, o.l))
                  )
                ),
                h(
                  "div",
                  null,
                  h(Label, null, "Age"),
                  h(Input, { inputMode: "numeric", value: age, onChange: (e) => setAge(e.target.value), placeholder: "e.g. 22" })
                )
              ),
              h("div", null, h(Label, null, "Password"), h(Input, { type: "password", value: password, onChange: (e) => setPassword(e.target.value), required: true })),
              h(
                "div",
                null,
                h(Label, null, "Skills"),
                h(Select, {
                  isMulti: true,
                  options: SKILL_OPTIONS,
                  value: skillsSelected,
                  onChange: (v) => setSkillsSelected(v || []),
                  placeholder: "Search and select skills...",
                  styles: selectStyles(),
                  menuPortalTarget: portalTarget,
                  menuPosition: "fixed"
                })
              ),
              h(
                "div",
                null,
                h(Label, null, "Availability"),
                h(Hint, null, "Add time windows you are usually available."),
                h(
                  "div",
                  { className: "mt-2 grid grid-cols-3 gap-2" },
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
                h(Button, { type: "button", variant: "subtle", className: "mt-2 w-full", onClick: addSlot }, "Add slot"),
                h(
                  "div",
                  { className: "mt-2 divide-y divide-neutral-200 overflow-hidden rounded-xl border border-white/60 bg-white/70" },
                  availability.length
                    ? availability.map((s, idx) =>
                        h(
                          "div",
                          { key: idx, className: "flex items-center justify-between px-3 py-2" },
                          h("div", { className: "text-sm text-neutral-900" }, `${days[s.dayOfWeek]} - ${s.startTime}-${s.endTime}`),
                          h(Button, { type: "button", variant: "ghost", onClick: () => removeSlot(idx) }, "Remove")
                        )
                      )
                    : h("div", { className: "px-3 py-3 text-sm text-neutral-600" }, "No availability yet")
                )
              ),
              h(Button, { type: "submit", disabled: pending, className: "w-full" }, pending ? "Creating..." : "Create account")
            ),
            h(Hint, null, h(Link, { to: "/login", className: "underline" }, "Already have an account? Sign in"))
          )
        : null,

      role === "ngo"
        ? h(
            "form",
            { onSubmit: submitNgo, className: "mt-6 space-y-4" },
            h(
              "div",
              { className: "rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur space-y-4" },
              h(
                "div",
                { className: "flex items-center justify-between" },
                h("div", { className: "text-sm font-semibold text-neutral-900" }, "NGO details"),
                h(
                  "button",
                  { type: "button", className: "text-xs text-neutral-700 underline", onClick: () => setRole("") },
                  "Change"
                )
              ),
              h("div", null, h(Label, null, "Organization name"), h(Input, { value: orgName, onChange: (e) => setOrgName(e.target.value), required: true })),
              h("div", null, h(Label, null, "Email"), h(Input, { type: "email", value: ngoEmail, onChange: (e) => setNgoEmail(e.target.value), required: true })),
              h("div", null, h(Label, null, "Phone"), h(Input, { value: ngoPhone, onChange: (e) => setNgoPhone(e.target.value) })),
              h("div", null, h(Label, null, "Password"), h(Input, { type: "password", value: ngoPassword, onChange: (e) => setNgoPassword(e.target.value), required: true })),
              h("div", null, h(Label, null, "Location"), h(Input, { value: location, onChange: (e) => setLocation(e.target.value) })),
              h(
                "div",
                null,
                h(Label, null, "Type"),
                h(
                  "select",
                  {
                    value: type,
                    onChange: (e) => setType(e.target.value),
                    className: "w-full rounded-xl border border-white/60 bg-white/80 px-3 py-2 text-sm shadow-sm backdrop-blur"
                  },
                  ...["Education", "Health", "Environment", "Disaster Relief", "Community"].map((v) => h("option", { key: v, value: v }, v))
                )
              ),
              h(
                "div",
                null,
                h(Label, null, "Description"),
                h("textarea", {
                  value: description,
                  onChange: (e) => setDescription(e.target.value),
                  rows: 4,
                  className: "w-full rounded-xl border border-white/60 bg-white/80 px-3 py-2 text-sm shadow-sm backdrop-blur"
                })
              ),
              h(Button, { type: "submit", disabled: pending, className: "w-full" }, pending ? "Creating..." : "Create NGO account")
            ),
            h(Hint, null, h(Link, { to: "/login", className: "underline" }, "Already have an account? Sign in"))
          )
        : null
    )
  );
}
