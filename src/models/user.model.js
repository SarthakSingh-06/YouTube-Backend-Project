import { Schema, models } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema({
    username: {
        type: String,
        unique: true,
        required: true,
        lowercase: true,
        trim: true,
        index: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
    },
    fullName: {
        type: String,
        required: true
    },
    watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    profileImage: {
        type: String, // Cloudinary URL
        required: true
    },
    coverImage: {
        type: String // Cloudinary URL
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minLength: [8, "Password must contain at least 8 characters"]
    },
    refershToken: {
        type: String
    }
},
{
    timestamps: true
});

userSchema.pre("save", function() {
    if (!this.isModified("password")) return;

    this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.generateAccessToken = function() {
    
}

export const User = models("User", userSchema);
