import { api } from "./client";

export async function issueShiftToken(eventId, shiftId) {
  const res = await api.post(`/api/attendance/events/${eventId}/shifts/${shiftId}/token`);
  return res.data;
}

export async function checkIn(payload) {
  const res = await api.post("/api/attendance/check-in", payload);
  return res.data;
}

export async function checkOut(payload) {
  const res = await api.post("/api/attendance/check-out", payload);
  return res.data;
}
