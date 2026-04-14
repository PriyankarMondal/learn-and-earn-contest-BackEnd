import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    contest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contest",
    },

    teamName: String,

    type: {
      type: String,
      enum: ["TEAM_INVITE"],
      default: "TEAM_INVITE",
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);