import express from "express";
import {
  getContests,
  joinContest,
  acceptInvite,
  rejectInvite,
  getMyNotifications,
  getContestDetails,
} from "../controller/contest.controller.js";

import { verifyJwt } from "../middleware/verify.jwt.js";

const router = express.Router();

/* 🎯 GET ALL CONTESTS */
router.get("/", verifyJwt, getContests);

/* 📝 JOIN CONTEST (TEAM INVITE) */
router.post("/join", verifyJwt, joinContest);

/* 🔔 NOTIFICATIONS */
router.get("/notifications", verifyJwt, getMyNotifications);

/* ✅ ACCEPT INVITE */

router.post("/accept-invite", verifyJwt, acceptInvite);

/* ❌ REJECT INVITE */
router.post("/reject-invite", verifyJwt, rejectInvite);

router.get("/contestDetails/:contestId", verifyJwt, getContestDetails);

export default router;