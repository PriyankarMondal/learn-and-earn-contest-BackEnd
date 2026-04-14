import mongoose from "mongoose";

const contestSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    contestType: {
      type: String,
      enum: ["single", "team", "both"],
      default: "single",
    },

    // 🔥 NEW: TEAM SIZE (only for team/both)
    teamSize: {
      type: Number,
      default: 1,
      min: 1,
    },

    prizeMoney: {
      type: Number,
      default: 0,
    },

    category: {
      type: String,
      enum: [
        "MERN Stack",
        "UI/UX Design",
        "Web Development",
        "Graphics Design",
        "ML/AI",
        "BlockChain",
        "Digital Marketing",
      ],
      required: true,
    },

    requirements: {
      type: String,
    },

    participantsCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Contest", contestSchema);