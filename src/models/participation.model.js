import mongoose from "mongoose";

const participationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    contest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contest",
    },

    // 🔥 NEW (for team contest)
    teamName: String,

    teamMembers: [
      {
        email: String,
      },
    ],
  },
  { timestamps: true }
);

// prevent duplicate join
participationSchema.index({ user: 1, contest: 1 }, { unique: true });

export default mongoose.model("Participation", participationSchema);