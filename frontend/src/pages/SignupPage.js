import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";

import { h } from "../utils/h";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Label } from "../components/ui/Label";
import { Hint } from "../components/ui/Hint";
import { signup } from "../services/api/authApi";
import { useAuthStore } from "../store/authStore";

export function SignupPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");

  const mutation = useMutation({
    mutationFn: signup,
    onSuccess: (data) => {
      setSession({ accessToken: data.accessToken, user: data.user });
      navigate("/app/profile", { replace: true });
    },
    onError: (e) => {
      setError(e?.response?.data?.error?.message || "Signup failed");
    }
  });

  function onSubmit(e) {
    e.preventDefault();
    setError("");
    mutation.mutate({ name, email, phone, password });
  }

  return h(
    "div",
    { className: "min-h-screen bg-neutral-50" },
    h(
      "div",
      { className: "mx-auto w-full max-w-md px-4 py-10" },
      h("div", { className: "text-lg font-semibold" }, "Create volunteer account"),
      h("div", { className: "mt-1 text-sm text-neutral-500" }, "Add skills and availability after signup"),
      h(
        "form",
        { onSubmit, className: "mt-6 space-y-4" },
        h("div", null, h(Label, null, "Name"), h(Input, { value: name, onChange: (e) => setName(e.target.value), autoComplete: "name", required: true })),
        h("div", null, h(Label, null, "Email"), h(Input, { value: email, onChange: (e) => setEmail(e.target.value), autoComplete: "email", inputMode: "email", required: true })),
        h("div", null, h(Label, null, "Phone (optional)"), h(Input, { value: phone, onChange: (e) => setPhone(e.target.value), autoComplete: "tel" })),
        h("div", null, h(Label, null, "Password"), h(Input, { value: password, onChange: (e) => setPassword(e.target.value), type: "password", autoComplete: "new-password", required: true })),
        error ? h("div", { className: "text-sm text-red-600" }, error) : null,
        h(Button, { type: "submit", disabled: mutation.isPending, className: "w-full" }, mutation.isPending ? "Creating…" : "Create account"),
        h(Hint, null, h(Link, { to: "/login", className: "underline" }, "Already have an account? Sign in"))
      )
    )
  );
}
