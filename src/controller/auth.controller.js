import asyncHandler from "../utils/asynchandler.js"
import { User } from "../models/user.model.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

// ================= REGISTER =================
export const registerEmployee = asyncHandler(async (req, res) => {
  const { name, email, number, password, gender } = req.body

  if (!name || !email || !number || !password) {
    return res.status(400).json({
      message: "All fields required",
    })
  }

  const existingUser = await User.findOne({
    $or: [{ email }, { number }],
  })

  if (existingUser) {
    return res.status(409).json({
      message: "Email or phone already registered",
    })
  }

  const username =
    name.substring(0, 4).toLowerCase() +
    "_" +
    Math.floor(1000 + Math.random() * 9000)

  const hashed = await bcrypt.hash(password, 10)

  const newUser = await User.create({
    name,
    email,
    password: hashed,
    number,
    gender,
    username,
  })

  return res.status(201).json({
    message: "User registered successfully",
    data: newUser,
  })
})

// ================= LOGIN =================
export const loginEmployee = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({
      message: "All fields are required",
    })
  }

  const existingEmployee = await User.findOne({ email })

  if (!existingEmployee) {
    return res.status(404).json({
      message: "Email not found",
    })
  }

  const isPasswordValid = await bcrypt.compare(
    password,
    existingEmployee.password
  )

  if (!isPasswordValid) {
    return res.status(401).json({
      message: "Incorrect email or password",
    })
  }

  // ✅ EXTRA SAFETY CHECK
  if (!process.env.ACCESS_TOKEN_SECRET) {
    throw new Error("ACCESS_TOKEN_SECRET missing in .env")
  }

  if (!process.env.REFRESH_TOKEN_SECRET) {
    throw new Error("REFRESH_TOKEN_SECRET missing in .env")
  }

  // ✅ Generate Tokens
  const accessToken = jwt.sign(
    { id: existingEmployee._id, role: existingEmployee.role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1d" }
  )

  const refreshToken = jwt.sign(
    { id: existingEmployee._id, role: existingEmployee.role },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d" }
  )

  existingEmployee.refreshtoken = refreshToken
  await existingEmployee.save({ validateBeforeSave: false })

  const cookieOptions = {
    httpOnly: true,
    secure: false, // keep false for localhost
    sameSite: "strict",
  }

  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000,
  })

  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })

  return res.status(200).json({
    message: "Login successful",
    user: {
      id: existingEmployee._id,
      email: existingEmployee.email,
      role: existingEmployee.role,
    },
  })
})

// ================= LOGOUT =================
export const logoutEmployee = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken

  if (refreshToken) {
    await User.findOneAndUpdate(
      { refreshToken: refreshToken },
      { refreshToken: null }
    )
  }

  res.clearCookie("accessToken")
  res.clearCookie("refreshToken")

  return res.status(200).json({
    message: "Logout successfully",
  })
})

// ================= GET USER =================
export const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params

  const user = await User.findById(id).select("-password")

  if (!user) {
    return res.status(404).json({
      message: "User not found",
    })
  }

  return res.status(200).json({
    message: "User found successfully",
    data: user,
  })
})

// ================= GET ALL USERS =================
export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password")

  res.status(200).json({
    success: true,
    count: users.length,
    users,
  })
})

// ================= DELETE =================
export const deleteUserById = asyncHandler(async (req, res) => {
  const { id } = req.params

  const deletedUser = await User.findByIdAndDelete(id)

  if (!deletedUser) {
    return res.status(404).json({
      message: "User not found",
    })
  }

  return res.status(200).json({
    message: "User deleted successfully",
  })
})