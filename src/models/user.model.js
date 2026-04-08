import mongoose, { Schema } from "mongoose"

const userSchema = new Schema({

    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        unique: true
    },
    username: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
        trim: true
    },
    role: {
        type: String,
        enum: ["Student", "Admin"],
        default: "Student"
    },
    gender:{
        type:String,
        enum:["Male","Female","Other"],
    },
    number: {
        type: String,
        unique: true,
        maxlength: 10,
        minlength: 10,
        required: true
    },
    refreshtoken: {
        type: String
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
    },
    tokenExpiry: {
      type: Date,
    }
},
    { timestamps: true }
);
export const User = mongoose.model("User", userSchema);