import Contest from "../models/contest.model.js";
import Submission from "../models/submission.model.js";
import asyncHandler from "../utils/asynchandler.js";

/* CREATE CONTEST */
export const createContest = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    startDate,
    endDate,
    contestType,
    prizeMoney,
    category,
    requirements,
  } = req.body;

  if (!title || !startDate || !endDate || !category) {
    return res.status(400).json({
      message: "Required fields missing",
    });
  }

  const contest = await Contest.create({
    title,
    description,
    startDate,
    endDate,
    contestType: contestType || "single",
    prizeMoney: prizeMoney || 0,
    category,
    requirements,
    createdBy: req.user._id,
  });

  res.status(201).json(contest);
});

/* DASHBOARD */
export const getDashboardStats = asyncHandler(async (req, res) => {
  const totalContests = await Contest.countDocuments();

  const activeContests = await Contest.countDocuments({
    startDate: { $lte: new Date() },
    endDate: { $gte: new Date() },
  });

  const submissions = await Submission.countDocuments();

  res.json({ totalContests, activeContests, submissions });
});

/* VIEW SUBMISSIONS */
export const getContestSubmissions = asyncHandler(async (req, res) => {
  const { contestId } = req.params;

  const submissions = await Submission.find({ contest: contestId })
    .populate("user", "name email");

  res.json(submissions);
});

/* GIVE SCORE */
export const giveScore = asyncHandler(async (req, res) => {
  const { submissionId, score } = req.body;

  if (!submissionId || score === undefined) {
    return res.status(400).json({
      message: "SubmissionId and score required",
    });
  }

  const submission = await Submission.findByIdAndUpdate(
    submissionId,
    { score, status: "reviewed" },
    { returnDocument: "after" }
  );

  if (!submission) {
    return res.status(404).json({
      message: "Submission not found",
    });
  }

  res.status(200).json({
    message: "Score updated successfully",
    submission,
  });
});