import express from "express";
import { joinContest, getLeaderboard } from "../controller/contest.controller.js";
import {verifyJwt} from "../middleware/verify.jwt.js";

const router = express.Router();

router.post("/join", verifyJwt, joinContest);
router.get("/leaderboard/:contestId", verifyJwt, getLeaderboard);

export default router;