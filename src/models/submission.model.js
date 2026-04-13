import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    contest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contest",
    },

    name: String,
    email: String,

    githubLink: String,
    liveLink: String,

    // 🔥 NEW
    description: String,

    score: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["pending", "reviewed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// one submission per user per contest
submissionSchema.index({ user: 1, contest: 1 }, { unique: true });

export default mongoose.model("Submission", submissionSchema);