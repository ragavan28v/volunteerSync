const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true
    },
    phone: { type: String, trim: true, maxlength: 30 },
    role: { type: String, required: true, enum: ["ngo", "volunteer"], index: true },
    passwordHash: { type: String, required: true },
    refreshTokenHash: { type: String },
    lastLoginAt: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);