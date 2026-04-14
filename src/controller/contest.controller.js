import Contest from "../models/contest.model.js";
import Participation from "../models/participation.model.js";
import Submission from "../models/submission.model.js";
import Notification from "../models/notification.model.js";
import asyncHandler from "../utils/asynchandler.js";
import { User } from "../models/user.model.js";

/* 🎯 GET ALL CONTESTS */
export const getContests = asyncHandler(async (req, res) => {
  const now = new Date();
  const contests = await Contest.find().sort({ createdAt: -1 });

  const userParticipations = await Participation.find({ user: req.user._id });
  const joinedContestIds = userParticipations.map(p => p.contest.toString());

  const formattedContests = await Promise.all(contests.map(async (contest) => {
    let status = "upcoming";
    if (now >= contest.startDate && now <= contest.endDate) status = "running";
    else if (now > contest.endDate) status = "ended";

    const submissionsCount = await Submission.countDocuments({ contest: contest._id });

    return {
      ...contest.toObject(),
      status,
      submissionsCount,
      isJoined: joinedContestIds.includes(contest._id.toString())
    };
  }));

  res.json(formattedContests);
});

/* 📝 JOIN CONTEST (CREATE TEAM + SEND INVITES) */
export const joinContest = asyncHandler(async (req, res) => {
  const { contestId, teamName, memberEmails } = req.body;

  const contest = await Contest.findById(contestId);
  if (!contest) return res.status(404).json({ message: "Contest not found" });

  const alreadyJoined = await Participation.findOne({
    user: req.user._id,
    contest: contestId,
  });

  if (alreadyJoined) {
    return res.status(400).json({ message: "Already joined" });
  }

  // 🔥 TEAM / BOTH
  if (contest.contestType === "team" || contest.contestType === "both") {
    if (!teamName || !memberEmails) {
      return res.status(400).json({ message: "Team name and members required" });
    }

    if (memberEmails.length !== contest.teamSize - 1) {
      return res.status(400).json({
        message: `You must invite exactly ${contest.teamSize - 1} members`,
      });
    }

    const participation = await Participation.create({
      user: req.user._id,
      contest: contestId,
      teamName,
      teamLeader: req.user._id,
      acceptedMembers: [req.user._id],
    });

    // 🔥 SEND INVITES
    for (const email of memberEmails) {
      const user = await User.findOne({ email });
      if (!user) continue;

      await Notification.create({
        sender: req.user._id,
        receiver: user._id,
        contest: contestId,
        teamName,
      });
    }

    await Contest.findByIdAndUpdate(contestId, {
      $inc: { participantsCount: 1 },
    });

    return res.json({ message: "Team created & invites sent", participation });
  }

  // 🔥 SINGLE
  await Participation.create({
    user: req.user._id,
    contest: contestId,
  });

  await Contest.findByIdAndUpdate(contestId, {
    $inc: { participantsCount: 1 },
  });

  res.json({ message: "Joined successfully" });
});

/* ✅ ACCEPT INVITE */
export const acceptInvite = asyncHandler(async (req, res) => {
  const { notificationId } = req.body;

  const notification = await Notification.findById(notificationId);
  if (!notification) return res.status(404).json({ message: "Notification not found" });

  if (notification.receiver.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  if (notification.status !== "pending") {
    return res.status(400).json({ message: "Already handled" });
  }

  const contest = await Contest.findById(notification.contest);

  const participation = await Participation.findOne({
    contest: contest._id,
    teamName: notification.teamName,
  });

  if (!participation) return res.status(404).json({ message: "Team not found" });

  if (participation.acceptedMembers.includes(req.user._id)) {
    return res.status(400).json({ message: "Already in team" });
  }

  if (participation.acceptedMembers.length >= contest.teamSize) {
    return res.status(400).json({ message: "Team is full" });
  }

  participation.acceptedMembers.push(req.user._id);
  await participation.save();

  notification.status = "accepted";
  await notification.save();

  // 🔥 AUTO REJECT OTHER INVITES
  await Notification.updateMany(
    {
      receiver: req.user._id,
      contest: contest._id,
      status: "pending",
    },
    { status: "rejected" }
  );

  res.json({ message: "Joined team successfully" });
});

/* ❌ REJECT INVITE */
export const rejectInvite = asyncHandler(async (req, res) => {
  const { notificationId } = req.body;

  const notification = await Notification.findById(notificationId);

  if (!notification) {
    return res.status(404).json({ message: "Notification not found" });
  }

  if (notification.receiver.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  if (notification.status !== "pending") {
    return res.status(400).json({ message: "Invite already handled" });
  }

  notification.status = "rejected";
  await notification.save();

  res.json({ message: "Invite rejected successfully" });
});

/* 🔔 GET MY NOTIFICATIONS */
export const getMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({
    receiver: req.user._id,
  })
    .populate("sender", "name email")
    .populate("contest", "title")
    .sort({ createdAt: -1 });

  res.json(notifications);
});
export const getContestDetails = asyncHandler(async (req, res) => {
  const { contestId } = req.params;

  const contest = await Contest.findById(contestId).populate(
    "createdBy",
    "name email"
  );

  if (!contest) {
    return res.status(404).json({ message: "Contest not found" });
  }

  const now = new Date();

  // 🔥 STATUS
  let status = "upcoming";
  if (now >= contest.startDate && now <= contest.endDate) {
    status = "running";
  } else if (now > contest.endDate) {
    status = "ended";
  }

  // 🔥 CHECK JOINED
  const participation = await Participation.findOne({
    user: req.user._id,
    contest: contestId,
  }).populate("acceptedMembers", "name email");

  // 🔥 CHECK SUBMISSION
  const submission = await Submission.findOne({
    user: req.user._id,
    contest: contestId,
  });

  res.json({
    contest: {
      _id: contest._id,
      title: contest.title,
      description: contest.description,
      startDate: contest.startDate,
      endDate: contest.endDate,
      contestType: contest.contestType,
      teamSize: contest.teamSize,
      prizeMoney: contest.prizeMoney,
      category: contest.category,
      requirements: contest.requirements,
      participantsCount: contest.participantsCount,
      createdBy: contest.createdBy,
      status,
    },

    // 🔥 USER RELATED DATA
    isJoined: !!participation,

    teamDetails: participation
      ? {
          teamName: participation.teamName,
          teamLeader: participation.teamLeader,
          members: participation.acceptedMembers,
        }
      : null,

    submission: submission
      ? {
          status: submission.status,
          score: submission.score,
          githubLink: submission.githubLink,
          liveLink: submission.liveLink,
        }
      : null,
  });
});