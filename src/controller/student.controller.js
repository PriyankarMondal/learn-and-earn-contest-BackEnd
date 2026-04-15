import Contest from "../models/contest.model.js";
import Participation from "../models/participation.model.js";
import Submission from "../models/submission.model.js";
import asyncHandler from "../utils/asynchandler.js";

/* 🎯 GET ALL CONTESTS (ENHANCED) */
export const getContests = asyncHandler(async (req, res) => {
  const now = new Date();
  const contests = await Contest.find().sort({ createdAt: -1 });

  // Get current user's participations to mark "isJoined" (only if logged in)
  let joinedContestIds = [];
  if (req.user && req.user._id) {
    const userParticipations = await Participation.find({ user: req.user._id });
    joinedContestIds = userParticipations.map(p => p.contest.toString());
  }

  // Get submission counts for all contests
  const formattedContests = await Promise.all(contests.map(async (contest) => {
    let status = "upcoming";
    if (now >= contest.startDate && now <= contest.endDate) {
      status = "running";
    } else if (now > contest.endDate) {
      status = "ended";
    }

    const submissionsCount = await Submission.countDocuments({ contest: contest._id });

    return {
      _id: contest._id.toString(),
      title: contest.title,
      description: contest.description,
      startDate: contest.startDate,
      endDate: contest.endDate,
      participantsCount: contest.participantsCount,
      prizeMoney: contest.prizeMoney,
      category: contest.category,
      contestType: contest.contestType,
      requirements: contest.requirements,
      status,
      submissionsCount,
      isJoined: joinedContestIds.includes(contest._id.toString())
    };
  }));

  res.status(200).json(formattedContests);
});

/* 📡 GET SINGLE CONTEST DETAILS — returns ALL fields including requirements */
export const getContestDetails = asyncHandler(async (req, res) => {
  const { contestId } = req.params;

  let contest = null;

  // Try standard ObjectId search
  try {
    contest = await Contest.findById(contestId);
  } catch (e) {
    // Not a valid ObjectId — will try string match below
  }

  // Fallback: search as plain string
  if (!contest) {
    contest = await Contest.findOne({ _id: contestId });
  }

  if (!contest) {
    return res.status(404).json({ message: "Contest not found" });
  }

  const now = new Date();
  let status = "upcoming";
  if (now >= contest.startDate && now <= contest.endDate) {
    status = "running";
  } else if (now > contest.endDate) {
    status = "ended";
  }

  // Check if current user has joined (safe for public/unauthenticated calls)
  let isJoined = false;
  if (req.user && req.user._id) {
    const participation = await Participation.findOne({
      user: req.user._id,
      contest: contest._id,
    });
    isJoined = !!participation;
  }

  const submissionsCount = await Submission.countDocuments({ contest: contest._id });

  // Return every field from DB, plus computed fields
  res.status(200).json({
    _id: contest._id.toString(),
    title: contest.title,
    description: contest.description,
    requirements: contest.requirements,
    contestType: contest.contestType,
    prizeMoney: contest.prizeMoney,
    category: contest.category,
    startDate: contest.startDate,
    endDate: contest.endDate,
    participantsCount: contest.participantsCount,
    status,
    submissionsCount,
    isJoined,
  });
});

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
    return res.status(400).json({
      message: "Already joined",
    });
  }

  let participationData = {
    user: req.user._id,
    contest: contestId,
  };

  // 🔥 TEAM CONTEST
  if (contest.contestType === "team") {
    if (!teamName || !teamMembers || teamMembers.length !== 2) {
      return res.status(400).json({
        message: "Team name and 2 member emails required",
      });
    }

    participationData.teamName = teamName;
    participationData.teamMembers = teamMembers;
  }

  await Participation.create(participationData);

  await Contest.findByIdAndUpdate(contestId, {
    $inc: { participantsCount: 1 },
  });

  res.json({ message: "Joined successfully" });
});

/* 📤 SUBMIT CONTEST */
export const submitContest = asyncHandler(async (req, res) => {
  const { contestId, githubLink, liveLink, description, name, email } = req.body;

  // validation
  if (!contestId || !githubLink || !liveLink || !description || !name || !email) {
    return res.status(400).json({
      message: "All fields are required (Name, Email, GitHub, Live Link, and Description)",
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
    return res.status(403).json({ message: "Join contest first" });
  }

  const alreadySubmitted = await Submission.findOne({
    user: req.user._id,
    contest: contestId,
  });

  if (alreadySubmitted) {
    return res.status(400).json({ message: "Already submitted" });
  }

  const submission = await Submission.create({
    user: req.user._id,
    contest: contestId,
    name,
    email,
    githubLink,
    liveLink,
    description,
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

/* 🏃 MY PARTICIPATIONS */
export const getMyParticipations = asyncHandler(async (req, res) => {
  const participations = await Participation.find({ user: req.user._id })
    .populate("contest");

  const submissions = await Submission.find({ user: req.user._id });

  const data = participations.map(p => {
    const submission = submissions.find(s => s.contest && s.contest.toString() === p.contest?._id.toString());
    return {
      contest: p.contest,
      joinedAt: p.createdAt,
      submitted: !!submission,
      submissionStatus: submission ? submission.status : null,
      score: submission ? submission.score : null
    };
  });

  res.json(data);
});

/* 📑 MY SUBMISSIONS (NEW) */
export const getMySubmissions = asyncHandler(async (req, res) => {
  const submissions = await Submission.find({ user: req.user._id })
    .populate("contest")
    .sort({ createdAt: -1 });

  res.status(200).json(submissions);
});

/* 📊 GET STUDENT DASHBOARD DATA (PROPER) */
export const getDashboardData = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // 1. Calculate Stats
  const joinedCount = await Participation.countDocuments({ user: userId });
  
  const participations = await Participation.find({ user: userId }).populate("contest");
  const now = new Date();
  const activeCount = participations.filter(p => p.contest && p.contest.startDate <= now && p.contest.endDate >= now).length;

  const submissions = await Submission.find({ user: userId });
  const pendingCount = submissions.filter(s => s.status === 'pending').length;
  
  // Total Earnings (Sum of all scores)
  const totalEarnings = submissions.reduce((sum, s) => sum + (s.score || 0), 0);

  // 2. Get Global Rank
  // To get rank, we need to aggregate all users' scores
  const allUserScores = await Submission.aggregate([
    { $group: { _id: "$user", totalScore: { $sum: "$score" } } },
    { $sort: { totalScore: -1 } }
  ]);
  
  const rankIndex = allUserScores.findIndex(u => u._id.toString() === userId.toString());
  const rank = rankIndex === -1 ? "N/A" : (rankIndex + 1).toString().padStart(2, '0');

  // 3. Recent Activity (Latest 3 interactions)
  // We'll combine participations and submissions for this
  const recentParticipations = await Participation.find({ user: userId })
    .populate("contest", "title")
    .sort({ createdAt: -1 })
    .limit(3);

  const activities = recentParticipations.map(p => ({
    type: 'join',
    title: p.contest?.title || 'Unknown Contest',
    date: p.createdAt,
    status: 'received'
  }));

  res.json({
    stats: {
      joined: joinedCount.toString().padStart(2, '0'),
      active: activeCount.toString().padStart(2, '0'),
      pending: pendingCount.toString().padStart(2, '0'),
      earnings: `₹${totalEarnings.toLocaleString()}`,
      rank
    },
    activities: activities.slice(0, 3)
  });
});

/* 🏆 GLOBAL LEADERBOARD */
export const getGlobalLeaderboard = asyncHandler(async (req, res) => {
  const { User } = await import("../models/user.model.js");

  const results = await Submission.aggregate([
    {
      $group: {
        _id: "$user",
        totalScore: { $sum: "$score" }
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "userDetails"
      }
    },
    { $unwind: "$userDetails" },
    {
      $project: {
        _id: 1,
        name: "$userDetails.name",
        totalScore: 1,
        avatar: "$userDetails.avatar"
      }
    },
    { $sort: { totalScore: -1 } },
    { $limit: 10 }
  ]);

  const formattedResults = results.map((r, i) => ({
    rank: (i + 1).toString().padStart(2, '0'),
    name: r.name,
    score: `₹${r.totalScore.toLocaleString()}`,
    _id: r._id
  }));

  res.json(formattedResults);
});
