const mongoose = require("mongoose");
const { env } = require("./env");

async function connectDb() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.MONGODB_URI, {
    autoIndex: env.NODE_ENV !== "production",
  });
}

module.exports = { connectDb };

