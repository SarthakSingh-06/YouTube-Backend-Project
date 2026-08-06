import { Schema, model } from "mongoose";

const likeSchema = new Schema({
    video: {
        type: Schema.Types.ObjectId,
        ref: "Video"
    },
    comment: {
        type: Schema.Types.ObjectId,
        ref: "Comments"
    },
    channelPost: {
        type: Schema.Types.ObjectId,
        ref: "ChannelPost"
    },
    likedBy: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
}, {
    timestamps: true
});

export const Likes = model("Likes", likeSchema);
