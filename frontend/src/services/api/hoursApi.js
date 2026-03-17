import { api } from "./client";

export async function logHours(payload) {
  const res = await api.post("/api/hours", payload);
  return res.data;
}

export async function listMyHours() {
  const res = await api.get("/api/hours/my");
  return res.data;
}

export async function verifyHours(id, verified) {
  const res = await api.patch(`/api/hours/${id}/verify`, { verified });
  return res.data;
}

export async function listHours(params) {
  const res = await api.get("/api/hours", { params });
  return res.data;
}
