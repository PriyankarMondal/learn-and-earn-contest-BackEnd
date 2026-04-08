// import express from "express"
// import dotenv from "dotenv"
// import cookieParser from "cookie-parser"
// import { connectDb } from "./dbconnect/dbconnect.js"
// import router from "./routes/auth.route.js"
// import adminRoutes from "./routes/admin.routes.js";
// import studentRoutes from "./routes/student.routes.js";
// import contestRoutes from "./routes/contest.routes.js";
// import cors from "cors";


// const APP = express()

// APP.use(
//   cors({
//     origin: "https://learn-and-earn-contest-frontenddist.onrender.com", // your frontend
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     credentials: true,
//   })
// );


// // ✅ FORCE LOAD ENV (MAIN FIX)
// dotenv.config({ path: "./.env" })




// // ✅ Connect DB AFTER env load
// connectDb()

// APP.use(express.json())
// APP.use(cookieParser())

// APP.use("/auth/v1", router);
// APP.use("/admin/v1", adminRoutes);
// APP.use("/student/v1", studentRoutes);
// APP.use("/contest/v1", contestRoutes);

// // Global error handler
// APP.use((err, req, res, next) => {
//   console.error(err)

//   res.status(err.status || 500).json({
//     message: err.message || "Internal Server Error",
//   })
// })

// const PORT = process.env.PORT || 5000

// APP.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`)
// })

import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { connectDb } from "./dbconnect/dbconnect.js";
import router from "./routes/auth.route.js";
import adminRoutes from "./routes/admin.routes.js";
import studentRoutes from "./routes/student.routes.js";
import contestRoutes from "./routes/contest.routes.js";
import cors from "cors";

dotenv.config({ path: "./.env" });

const APP = express();

// ✅ Allowed origins (DEV + PROD)
const allowedOrigins = [
  "http://localhost:5173",
  "https://learn-and-earn-contest-frontenddist.onrender.com",
];

// ✅ Dynamic CORS (BEST PRACTICE)
APP.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);



connectDb();

APP.use(express.json());
APP.use(cookieParser());

APP.use("/auth/v1", router);
APP.use("/admin/v1", adminRoutes);
APP.use("/student/v1", studentRoutes);
APP.use("/contest/v1", contestRoutes);

// Global error handler
APP.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 8000;

APP.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});