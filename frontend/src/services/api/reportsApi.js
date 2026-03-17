import { api } from "./client";

export async function downloadVolunteersCsv(params) {
  const res = await api.get("/api/reports/volunteers.csv", {
    params,
    responseType: "blob"
  });
  return res.data;
}
