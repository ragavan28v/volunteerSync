import { api } from "./client";

export async function createAssignment(payload) {
  const res = await api.post("/api/assignments", payload);
  return res.data;
}

export async function listMyAssignments() {
  const res = await api.get("/api/assignments/my");
  return res.data;
}

export async function updateMyAssignmentStatus(id, status) {
  const res = await api.patch(`/api/assignments/${id}/status`, { status });
  return res.data;
}
