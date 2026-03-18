import { api } from "./client";

export async function listNotifications(params) {
  const res = await api.get("/api/notifications", { params });
  return res.data;
}

export async function markNotificationRead(id) {
  const res = await api.patch(`/api/notifications/${id}/read`);
  return res.data;
}

export async function markAllNotificationsRead() {
  const res = await api.post("/api/notifications/mark-all-read");
  return res.data;
}