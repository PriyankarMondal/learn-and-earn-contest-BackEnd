import Contest from "../models/contest.model.js";
import Participation from "../models/participation.model.js";
import Submission from "../models/submission.model.js";
import asyncHandler from "../utils/asynchandler.js";

/* JOIN CONTEST */
export const joinContest = asyncHandler(async (req, res) => {
  const { contestId } = req.body;

  await Participation.create({
    user: req.user._id,
    contest: contestId,
  });

  await Contest.findByIdAndUpdate(contestId, {
    $inc: { participantsCount: 1 },
  });

  res.json({ message: "Joined successfully" });
});

/* LEADERBOARD */
export const getLeaderboard = asyncHandler(async (req, res) => {
  const { contestId } = req.params;

  const leaderboard = await Submission.find({ contest: contestId })
    .populate("user", "name email")
    .sort({ score: -1 });

  res.json(leaderboard);
});