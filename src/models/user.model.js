import { Schema, models } from "mongoose";

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
    watchHistory: {
        type: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ]
    },
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

export const User = models("User", userSchema);
