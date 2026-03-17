import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";

import { h } from "../utils/h";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Label } from "../components/ui/Label";
import { Hint } from "../components/ui/Hint";
import { login } from "../services/api/authApi";
import { useAuthStore } from "../store/authStore";

export function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setSession({ accessToken: data.accessToken, user: data.user });
      navigate("/app", { replace: true });
    },
    onError: (e) => {
      setError(e?.response?.data?.error?.message || "Login failed");
    }
  });

  function onSubmit(e) {
    e.preventDefault();
    setError("");
    mutation.mutate({ email, password });
  }

  return h(
    "div",
    { className: "min-h-screen bg-neutral-50" },
    h(
      "div",
      { className: "mx-auto w-full max-w-md px-4 py-10" },
      h("div", { className: "text-lg font-semibold" }, "Sign in"),
      h("div", { className: "mt-1 text-sm text-neutral-500" }, "For admins and volunteers"),
      h(
        "form",
        { onSubmit, className: "mt-6 space-y-4" },
        h(
          "div",
          null,
          h(Label, null, "Email"),
          h(Input, {
            value: email,
            onChange: (e) => setEmail(e.target.value),
            autoComplete: "email",
            inputMode: "email",
            placeholder: "you@example.org"
          })
        ),
        h(
          "div",
          null,
          h(Label, null, "Password"),
          h(Input, {
            value: password,
            onChange: (e) => setPassword(e.target.value),
            type: "password",
            autoComplete: "current-password",
            placeholder: "••••••••"
          })
        ),
        error ? h("div", { className: "text-sm text-red-600" }, error) : null,
        h(
          Button,
          { type: "submit", disabled: mutation.isPending, className: "w-full" },
          mutation.isPending ? "Signing in…" : "Sign in"
        ),
        h(Hint, null, h(Link, { to: "/signup", className: "underline" }, "New volunteer? Create an account"))
      )
    )
  );
}
