import Contest from "../models/contest.model.js";
import Participation from "../models/participation.model.js";
import Submission from "../models/submission.model.js";
import asyncHandler from "../utils/asynchandler.js";

/* JOIN CONTEST */
export const joinContest = asyncHandler(async (req, res) => {
  const { contestId, teamName, teamMembers } = req.body;

  const contest = await Contest.findById(contestId);

  if (!contest) {
    return res.status(404).json({ message: "Contest not found" });
  }

  // 🔥 TEAM CONTEST VALIDATION
  if (contest.contestType === "team" || contest.contestType === "both") {
    if (!teamName) {
      return res.status(400).json({
        message: "Team name is required",
      });
    }

    if (!teamMembers || !Array.isArray(teamMembers)) {
      return res.status(400).json({
        message: "Team members are required",
      });
    }

    // 🔥 IMPORTANT LOGIC
    if (teamMembers.length !== contest.teamSize - 1) {
      return res.status(400).json({
        message: `Team must have exactly ${contest.teamSize} members (including you)`,
      });
    }
  }

  await Participation.create({
    user: req.user._id,
    contest: contestId,
    teamName: teamName || null,
    teamMembers: teamMembers || [],
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