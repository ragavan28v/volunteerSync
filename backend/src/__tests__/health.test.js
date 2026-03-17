const request = require("supertest");
const { createApp } = require("../app");

describe("health", () => {
  test("GET /health", async () => {
    const app = createApp();
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});
