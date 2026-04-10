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
      enum: ["single", "team"],
      default: "single",
    },

    // 🔥 NEW FIELDS
    prizeMoney: {
      type: Number,
      default: 0,
    },

    category: {
      type: String,
      enum: [
        "UI/UX Design",
        "MERN Stack",
        "Web Development",
        "Graphics Design",
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