import express from "express";
import {
  createContest,
  getDashboardStats,
  getContestSubmissions,
  getAllSubmissions,
  giveScore,
  getAllUsers,
  toggleUserStatus,
} from "../controller/admin.controller.js";

import {verifyJwt} from "../middleware/verify.jwt.js";
import {checkrole} from "../middleware/checkrole.js";

const router = express.Router();

router.post("/create", verifyJwt, checkrole, createContest);
router.get("/dashboard", verifyJwt, checkrole, getDashboardStats);
router.get("/submissions/:contestId", verifyJwt, checkrole, getContestSubmissions);
router.get("/all-submissions", verifyJwt, checkrole, getAllSubmissions);
router.post("/score", verifyJwt, checkrole, giveScore);
router.get("/users", verifyJwt, checkrole, getAllUsers);
router.post("/toggle-user", verifyJwt, checkrole, toggleUserStatus);

export default router;