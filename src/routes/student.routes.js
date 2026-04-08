import express from "express";
import {
  getContests,
  joinContest,
  submitContest,
  getLeaderboard,
} from "../controller/student.controller.js";

import { verifyJwt } from "../middleware/verify.jwt.js";

const router = express.Router();

router.get("/contests", verifyJwt, getContests); 
router.post("/join", verifyJwt, joinContest);
router.post("/submit", verifyJwt, submitContest);
router.get("/leaderboard/:contestId", verifyJwt, getLeaderboard);

export default router;