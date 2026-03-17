const { connectDb } = require("../utils/connectDb");
const { env } = require("../utils/env");
const User = require("../models/User");
const { hashPassword } = require("../services/passwordService");

async function run() {
  await connectDb();

  const email = env.SEED_ADMIN_EMAIL.toLowerCase();
  const existing = await User.findOne({ email });
  if (existing) {
    // eslint-disable-next-line no-console
    console.log(`[seed] admin already exists: ${email}`);
    process.exit(0);
  }

  const passwordHash = await hashPassword(env.SEED_ADMIN_PASSWORD);
  await User.create({
    name: env.SEED_ADMIN_NAME,
    email,
    phone: "",
    role: "admin",
    passwordHash
  });

  // eslint-disable-next-line no-console
  console.log(`[seed] created admin: ${email}`);
  process.exit(0);
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[seed] failed", err);
  process.exit(1);
});
