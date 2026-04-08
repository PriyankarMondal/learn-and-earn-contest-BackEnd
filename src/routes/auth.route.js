import express from "express"
import { deleteUserById, getAllUsers, getUserById, loginEmployee, logoutEmployee, registerEmployee } from "../controller/auth.controller.js"
import { verifyJwt } from "../middleware/verify.jwt.js"
import { checkrole } from "../middleware/checkrole.js"







const router = express.Router()

router.post("/register",registerEmployee)
router.post("/login", loginEmployee)
router.get("/getprofile/:id", verifyJwt , checkrole,getUserById)
router.get("/logout",verifyJwt, logoutEmployee)
router.get("/getAllUser",verifyJwt, checkrole, getAllUsers )
router.delete("/delete/:id",verifyJwt, checkrole, deleteUserById)

export default router   