process.env.MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/_smoke";
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "smoke_access";
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "smoke_refresh";
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

const http = require("http");
const assert = require("assert");
const { createApp } = require("../app");

async function main() {
  const app = createApp();
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();

  const res = await new Promise((resolve, reject) => {
    const req = http.get({ hostname: "127.0.0.1", port, path: "/health" }, (r) => {
      let data = "";
      r.on("data", (c) => (data += c));
      r.on("end", () => resolve({ status: r.statusCode, data }));
    });
    req.on("error", reject);
  });

  server.close();

  assert.equal(res.status, 200);
  const body = JSON.parse(res.data);
  assert.deepEqual(body, { ok: true });

  // eslint-disable-next-line no-console
  console.log("[smoke] ok");
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[smoke] failed", err);
  process.exit(1);
});
