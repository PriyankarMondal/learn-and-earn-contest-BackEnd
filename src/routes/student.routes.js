import express from "express";
import {
  getContests,
  joinContest,
  submitContest,
  getLeaderboard,
  getMyParticipations,
  getMySubmissions,
} from "../controller/student.controller.js";

import { verifyJwt } from "../middleware/verify.jwt.js";

const router = express.Router();

router.get("/contests", verifyJwt, getContests); 
router.post("/join", verifyJwt, joinContest);
router.post("/submit", verifyJwt, submitContest);
router.get("/leaderboard/:contestId", verifyJwt, getLeaderboard);
router.get("/my-participations", verifyJwt, getMyParticipations);
router.get("/my-submissions", verifyJwt, getMySubmissions);

export default router;