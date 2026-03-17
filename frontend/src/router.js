import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

import { h } from "./utils/h";
import { useAuthStore } from "./store/authStore";

import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { AppShell } from "./components/AppShell";

import { DashboardPage } from "./pages/DashboardPage";
import { EventsPage } from "./pages/EventsPage";
import { EventDetailPage } from "./pages/EventDetailPage";
import { AssignmentsPage } from "./pages/AssignmentsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { VolunteersPage } from "./pages/admin/VolunteersPage";
import { HoursAdminPage } from "./pages/admin/HoursAdminPage";

function RequireAuth({ children }) {
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);

  if (!token || !user) return h(Navigate, { to: "/login", replace: true });
  return children;
}

function RequireAdmin({ children }) {
  const user = useAuthStore((s) => s.user);
  if (!user || user.role !== "admin") return h(Navigate, { to: "/app", replace: true });
  return children;
}

export const router = createBrowserRouter([
  { path: "/", element: h(Navigate, { to: "/app", replace: true }) },
  { path: "/login", element: h(LoginPage) },
  { path: "/signup", element: h(SignupPage) },
  {
    path: "/app",
    element: h(RequireAuth, null, h(AppShell)),
    children: [
      { index: true, element: h(DashboardPage) },
      { path: "events", element: h(EventsPage) },
      { path: "events/:id", element: h(EventDetailPage) },
      { path: "assignments", element: h(AssignmentsPage) },
      { path: "profile", element: h(ProfilePage) },
      {
        path: "admin/volunteers",
        element: h(RequireAdmin, null, h(VolunteersPage))
      },
      {
        path: "admin/hours",
        element: h(RequireAdmin, null, h(HoursAdminPage))
      }
    ]
  },
  { path: "*", element: h(Navigate, { to: "/app", replace: true }) }
]);
