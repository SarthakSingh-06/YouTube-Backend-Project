import { asyncHandler } from "../utils/asyncHandler.js";
import { API_Response } from "../utils/api-response.js";
import { API_Error } from "../utils/api-error.js";
import { Likes } from "../models/likes.model.js";
import { Comments } from "../models/comments.model.js";
import { Types as mongooseTypes } from "mongoose";

export const getLikedVideos = asyncHandler(async (req, res) => {
    // TODO: get all liked videos
});

export const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    if (!commentId)
        throw new API_Error(400, "Must provide the comment id to toggle like");

    // remove the like if comment is already liked
    const removeLike = await Likes.findOneAndDelete({
        likedBy: new mongooseTypes.ObjectId(req.user?._id),
        comment: new mongooseTypes.ObjectId(commentId),
    });

    if (!removeLike) {
        const newLike = await Likes.insertOne({
            likedBy: new mongooseTypes.ObjectId(req.user?._id),
            comment: new mongooseTypes.ObjectId(commentId),
        });

        // send comment liked response
        return res
            .status(201)
            .json(
                new API_Response(201, newLike, "comment liked")
            );
    }

    // send comment like removed response
    return res
        .status(200)
        .json(
            new API_Response(200, removeLike, "comment like removed")
        );
});

export const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!videoId)
        throw new API_Error(400, "Must provide the video id to toggle like");

    // remove the like if video is already liked
    const removeLike = await Likes.findOneAndDelete({
        video: new mongooseTypes.ObjectId(videoId),
        likedBy: new mongooseTypes.ObjectId(req.user?._id),
    });

    if (!removeLike) {
        // like the video if like does not exist
        const newLike = await Likes.insertOne({
            video: new mongooseTypes.ObjectId(videoId),
            likedBy: new mongooseTypes.ObjectId(req.user?._id),
        });

        // send video liked response
        return res
            .status(201)
            .json(
                new API_Response(201, newLike, "video liked")
            );
    }

    // send video like removed response
    return res
        .status(200)
        .json(
            new API_Response(200, removeLike, "video like removed")
        );
});

export const togglechannelPostLike = asyncHandler(async (req, res) => {
    const { channelPostId } = req.params;
    if (!channelPostId)
        throw new API_Error(400, "Must provide the channel post id to toggle like");

    // remove the like if post is already liked
    const removeLike = await Likes.findOneAndDelete({
        likedBy: new mongooseTypes.ObjectId(req.user?._id),
        channelPost: new mongooseTypes.ObjectId(channelPostId)
    });

    if (!removeLike) {
        // like the post if like does not exist
        const newLike = await Likes.insertOne({
            channelPost: new mongooseTypes.ObjectId(channelPostId),
            likedBy: new mongooseTypes.ObjectId(req.user?._id),
        });

        // send post liked response
        return res
            .status(201)
            .json(
                new API_Response(201, newLike, "channel post liked")
            );
    }

    // send post like removed response
    return res
        .status(200)
        .json(
            new API_Response(200, removeLike, "channel post like removed")
        );
});
