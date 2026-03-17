const http = require("http");
const { connectDb } = require("./utils/connectDb");
const { createApp } = require("./app");
const { env } = require("./utils/env");

async function start() {
  await connectDb();

  const app = createApp();
  const server = http.createServer(app);

  server.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`[api] listening on http://localhost:${env.PORT}`);
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[api] failed to start", err);
  process.exit(1);
});

