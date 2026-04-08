import express from "express";
import {
  createContest,
  getDashboardStats,
  getContestSubmissions,
  giveScore,
} from "../controller/admin.controller.js";

import {verifyJwt} from "../middleware/verify.jwt.js";
import {checkrole} from "../middleware/checkrole.js";

const router = express.Router();

router.post("/create", verifyJwt, checkrole, createContest);
router.get("/dashboard", verifyJwt, checkrole, getDashboardStats);
router.get("/submissions/:contestId", verifyJwt, checkrole, getContestSubmissions);
router.post("/score", verifyJwt, checkrole, giveScore);

export default router;