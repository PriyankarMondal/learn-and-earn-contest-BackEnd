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

/* DASHBOARD STATS */
export const getDashboardStats = asyncHandler(async (req, res) => {
  const { User } = await import("../models/user.model.js");
  const Participation = (await import("../models/participation.model.js")).default;
  
  const totalContests = await Contest.countDocuments();
  const activeContestsCount = await Contest.countDocuments({
    startDate: { $lte: new Date() },
    endDate: { $gte: new Date() },
  });
  const totalSubmissions = await Submission.countDocuments();
  const pendingSubmissions = await Submission.countDocuments({ status: "pending" });
  
  // User metrics
  const totalStudents = await User.countDocuments({ role: "Student" });
  const totalAdmins = await User.countDocuments({ role: "Admin" });
  const pendingVerification = await User.countDocuments({ isVerified: false });
  
  // Submission trends
  const evaluatedToday = await Submission.countDocuments({ 
    status: "reviewed", 
    updatedAt: { $gte: new Date(new Date().setHours(0,0,0,0)) } 
  });
  
  // Participant Count (Unique student IDs)
  const participants = await Participation.distinct("user");
  const totalParticipants = participants.length;

  res.json({ 
    totalContests, 
    activeContests: activeContestsCount, 
    submissions: totalSubmissions,
    pendingSubmissions,
    totalParticipants,
    totalStudents,
    totalAdmins,
    pendingVerification,
    evaluatedToday,
    winnerSlots: 42 // Mock or calculate if necessary, for now letting it be dynamic-ready
  });
});

/* VIEW SUBMISSIONS PER CONTEST */
export const getContestSubmissions = asyncHandler(async (req, res) => {
  const { contestId } = req.params;
  const submissions = await Submission.find({ contest: contestId })
    .populate("user", "name email");

  res.json(submissions);
});

/* GET ALL SUBMISSIONS (GLOBAL) */
export const getAllSubmissions = asyncHandler(async (req, res) => {
  const submissions = await Submission.find()
    .populate("user", "name email")
    .populate("contest", "title")
    .sort({ createdAt: -1 });

  res.json(submissions);
});

/* GIVE SCORE / REVIEW SUBMISSION */
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
    { new: true }
  ).populate("user", "name email");

  if (!submission) {
    return res.status(404).json({ message: "Submission not found" });
  }

  res.status(200).json({
    message: "Score updated successfully",
    submission,
  });
});

/* GET ALL USERS */
export const getAllUsers = asyncHandler(async (req, res) => {
  // We use late import to avoid potential circular dependencies if User model imports something else
  const { User } = await import("../models/user.model.js");
  const users = await User.find().select("-password").sort({ createdAt: -1 });
  
  res.json(users);
});

/* TOGGLE USER STATUS (ACTIVE/INACTIVE) */
export const toggleUserStatus = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  const { User } = await import("../models/user.model.js");

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Toggle isVerified to represent account activation state
  user.isVerified = !user.isVerified;
  await user.save();

  res.json({ 
    message: `Account set to ${user.isVerified ? 'Active' : 'Inactive'}`, 
    user 
  });
});