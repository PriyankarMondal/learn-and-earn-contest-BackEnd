import asyncHandler from "../utils/asynchandler.js"
import { User } from "../models/user.model.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

// ================= REGISTER =================
export const registerEmployee = asyncHandler(async (req, res) => {
  const { name, email, number, password, gender, role } = req.body

  if (!name || !email || !number || !password) {
    return res.status(400).json({ message: "All fields required" })
  }

  const existingUser = await User.findOne({
    $or: [{ email }, { number }],
  })

  if (existingUser) {
    return res.status(409).json({ message: "Email or phone already registered" })
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
    role: role || "Student",
  })

  return res.status(201).json({
    message: "User registered successfully",
    user: {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role
    }
  })
})

// ================= LOGIN =================
export const loginEmployee = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" })
  }

  const existingUser = await User.findOne({ email })

  if (!existingUser) {
    return res.status(404).json({ message: "Email not found" })
  }

  const isPasswordValid = await bcrypt.compare(password, existingUser.password)

  if (!isPasswordValid) {
    return res.status(401).json({ message: "Incorrect email or password" })
  }

  // ✅ Generate Tokens
  const accessToken = jwt.sign(
    { id: existingUser._id, role: existingUser.role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1d" }
  )

  const refreshToken = jwt.sign(
    { id: existingUser._id, role: existingUser.role },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d" }
  )

  existingUser.refreshtoken = refreshToken
  await existingUser.save({ validateBeforeSave: false })

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  }

  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: 24 * 60 * 60 * 1000,            //  here it allow 24 hours for accesstoken
  })

  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,            //  here it allow 7 days then coolie will be cleared
  })

  return res.status(200).json({
    message: "Login successful",
    user: {
      id: existingUser._id,
      name: existingUser.name,
      email: existingUser.email,
      role: existingUser.role,
    },
  })
})

// ================= LOGOUT =================
export const logoutEmployee = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (refreshToken) {
    await User.findOneAndUpdate(
      { refreshtoken: refreshToken }, // Fixed key 'refreshtoken' to match model
      { refreshtoken: null }
    );
  }

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  };

  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);

  return res.status(200).json({
    success: true,
    message: "Logout successfully",
  });
});

// ================= GET CURRENT PROFILE =================
export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password")
  res.status(200).json(user)
})

// ================= UPDATE PROFILE =================
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, email, number, gender } = req.body

  const user = await User.findById(req.user._id)
  if (!user) {
    return res.status(404).json({ message: "User not found" })
  }

  if (name) user.name = name
  if (email && email !== user.email) {
    const emailExists = await User.findOne({ email });
    if (emailExists) return res.status(400).json({ message: "Email already taken" });
    user.email = email
  }
  if (number) user.number = number
  if (gender) user.gender = gender

  await user.save()

  res.json({
    message: "Profile updated successfully",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      number: user.number,
      gender: user.gender
    }
  })
})

// ================= ADMIN HELPERS =================
export const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params
  const user = await User.findById(id).select("-password")
  if (!user) return res.status(404).json({ message: "User not found" })
  res.status(200).json(user)
})

export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password").sort({ createdAt: -1 })
  res.status(200).json(users)
})

export const deleteUserById = asyncHandler(async (req, res) => {
  const { id } = req.params
  const deletedUser = await User.findByIdAndDelete(id)
  if (!deletedUser) return res.status(404).json({ message: "User not found" })
  res.status(200).json({ message: "User deleted successfully" })
})