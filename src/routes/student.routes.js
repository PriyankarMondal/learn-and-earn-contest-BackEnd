import express from "express";
import {
  getContests,
  getContestDetails,
  joinContest,
  submitContest,
  getLeaderboard,
  getMyParticipations,
  getMySubmissions,
  getDashboardData,
  getGlobalLeaderboard,
} from "../controller/student.controller.js";

import { verifyJwt } from "../middleware/verify.jwt.js";

const router = express.Router();

// --- PUBLIC ROUTES (No login required — for home page) ---
router.get("/public-contests", getContests);
router.get("/public-contest/:contestId", getContestDetails);

// --- PROTECTED ROUTES (Login required) ---
router.get("/contests", verifyJwt, getContests); 
router.get("/contest/:contestId", verifyJwt, getContestDetails);

router.post("/join", verifyJwt, joinContest);
router.post("/submit", verifyJwt, submitContest);
router.get("/leaderboard/:contestId", verifyJwt, getLeaderboard);
router.get("/my-participations", verifyJwt, getMyParticipations);
router.get("/my-submissions", verifyJwt, getMySubmissions);
router.get("/dashboard-stats", verifyJwt, getDashboardData);
router.get("/global-leaderboard", verifyJwt, getGlobalLeaderboard);

export default router;