import { Schema, model } from "mongoose";

const channelPostSchema = new Schema({
    content: {
        type: String,
        required: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
}, {
    timestamps: true
});

export const ChannelPosts = model("ChannelPosts", channelPostSchema);
