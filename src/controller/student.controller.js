import Contest from "../models/contest.model.js";
import Participation from "../models/participation.model.js";
import Submission from "../models/submission.model.js";
import asyncHandler from "../utils/asynchandler.js";

/* 🎯 GET ALL CONTESTS (BEST VERSION) */
export const getContests = asyncHandler(async (req, res) => {
  const now = new Date();

  const contests = await Contest.find().sort({ createdAt: -1 });

  const formattedContests = contests.map((contest) => {
    let status = "upcoming";

    if (now >= contest.startDate && now <= contest.endDate) {
      status = "running";
    } else if (now > contest.endDate) {
      status = "ended";
    }

    return {
      _id: contest._id,
      title: contest.title,
      description: contest.description,
      startDate: contest.startDate,
      endDate: contest.endDate,
      participantsCount: contest.participantsCount,
      status, 
    };
  });

  res.status(200).json(formattedContests);
});

/* 📝 JOIN CONTEST */
export const joinContest = asyncHandler(async (req, res) => {
  const { contestId } = req.body;

  const contest = await Contest.findById(contestId);
  if (!contest) {
    return res.status(404).json({ message: "Contest not found" });
  }

  const now = new Date();

  if (now > contest.endDate) {
    return res.status(400).json({
      message: "Contest already ended",
    });
  }

  const alreadyJoined = await Participation.findOne({
    user: req.user._id,
    contest: contestId,
  });

  if (alreadyJoined) {
    return res.status(400).json({ message: "Already joined" });
  }

  await Participation.create({
    user: req.user._id,
    contest: contestId,
  });

  await Contest.findByIdAndUpdate(contestId, {
    $inc: { participantsCount: 1 },
  });

  res.json({ message: "Joined successfully" });
});

/* 📤 SUBMIT CONTEST */
export const submitContest = asyncHandler(async (req, res) => {
  const { contestId, githubLink, liveLink, name, email } = req.body;

  // validation
  if (!contestId || !githubLink || !liveLink || !name || !email) {
    return res.status(400).json({
      message: "All fields are required",
    });
  }

  const contest = await Contest.findById(contestId);

  if (!contest) {
    return res.status(404).json({ message: "Contest not found" });
  }

  const now = new Date();

  if (now < contest.startDate) {
    return res.status(400).json({
      message: "Contest has not started yet",
    });
  }

  if (now > contest.endDate) {
    return res.status(400).json({
      message: "Contest has ended",
    });
  }

  const joined = await Participation.findOne({
    user: req.user._id,
    contest: contestId,
  });

  if (!joined) {
    return res.status(403).json({
      message: "Join contest first",
    });
  }

  const alreadySubmitted = await Submission.findOne({
    user: req.user._id,
    contest: contestId,
  });

  if (alreadySubmitted) {
    return res.status(400).json({
      message: "Already submitted",
    });
  }

  const submission = await Submission.create({
    user: req.user._id,
    contest: contestId,
    githubLink,
    liveLink,
    name,
    email,
  });

  res.status(201).json({
    message: "Submission successful",
    submission,
  });
});

/* 🏆 LEADERBOARD */
export const getLeaderboard = asyncHandler(async (req, res) => {
  const { contestId } = req.params;

  const leaderboard = await Submission.find({ contest: contestId })
    .populate("user", "name email")
    .sort({ score: -1 });

  res.status(200).json(leaderboard);
});