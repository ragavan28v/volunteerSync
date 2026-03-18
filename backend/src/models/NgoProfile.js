const mongoose = require("mongoose");

const NgoProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    organizationName: { type: String, required: true, trim: true, maxlength: 160 },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true, maxlength: 30 },
    location: { type: String, trim: true, maxlength: 240 },
    description: { type: String, trim: true, maxlength: 5000 },
    type: {
      type: String,
      trim: true,
      maxlength: 80,
      enum: [
        "Education",
        "Health",
        "Environment",
        "Disaster Relief",
        "Animal Welfare",
        "Community",
        "Other"
      ],
      default: "Other"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("NgoProfile", NgoProfileSchema);