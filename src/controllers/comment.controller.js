import { Comments } from "../models/comments.model.js";
import { Video } from "../models/video.model.js";
import { Types as mongooseTypes, isValidObjectId } from "mongoose";
import { API_Error } from "../utils/api-error.js";
import { API_Response } from "../utils/api-response.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getVideoComments = asyncHandler(async (req, res) => {
    const videoId = req.params.videoId;
    if (!mongooseTypes.isValidObjectId(videoId))
        throw new API_Error(400, "Invalid video ID");

    // by default page = 1 and limit = 10
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const aggregateOptions = { page, limit };

    const aggregate = Comments.aggregate([
        {
            $match: {
                video: new mongooseTypes.ObjectId(videoId),
            },
        },
        {
            $sort: {
                createdAt: -1, // get newest comment first
            },
        },
    ]);

    const videoComments = await Comments.aggregatePaginate(
        aggregate,
        aggregateOptions
    );

    return res
        .status(200)
        .json(
            new API_Response(
                200,
                videoComments,
                "Comments for video fetched successfully"
            )
        );
});

export const addComment = asyncHandler(async (req, res) => {
    const videoId = req.params.videoId;
    const existingVideo = await Video.findById(videoId, { _id: 1 });
    if (!existingVideo) throw new API_Error(404, "Video not found.");

    const comment = req.body.comment;
    if (!comment || comment.trim() === "")
        throw new API_Error(400, "Input cannot be empty or just spaces");

    const newComment = await Comments.insertOne({
        video: new mongooseTypes.ObjectId(videoId),
        owner: new mongooseTypes.ObjectId(req.user?._id),
        content: comment,
    });

    return res.status(201).json(
        new API_Response(
            201,
            {
                commentId: newComment._id,
                content: comment,
                createdAt: newComment.createdAt,
            },
            "comment added"
        )
    );
});

export const updateComment = asyncHandler(async (req, res) => {
    const commentId = req.params.commentId;
    const newComment = req.body.content;
    if (!newComment || newComment.trim() === "")
        throw new API_Error(400, "Input cannot be empty or just spaces");

    const updatedComment = await Comments.findOneAndUpdate(
        {
            _id: new mongooseTypes.ObjectId(commentId),
            owner: new mongooseTypes.ObjectId(req.user?._id),
        },
        {
            $set: {
                content: newComment,
            },
        },
        {
            returnDocument: "after",
        }
    ).select("-owner -createdAt -video");

    return res
        .status(200)
        .json(
            new API_Response(
                200,
                updatedComment,
                "Comment updated successfully"
            )
        );
});

export const deleteComment = asyncHandler(async (req, res) => {
    const commentId = req.params.commentId;
    const deletedComment = await Comments.findOneAndDelete({
        _id: new mongooseTypes.ObjectId(commentId),
        owner: new mongooseTypes.ObjectId(req.user?._id),
    });

    if (!deletedComment) throw new API_Error(404, "Comment not found");

    return res.status(200).json(
        new API_Response(
            200,
            {
                deletedComment,
            },
            "Comment deleted successfully"
        )
    );
});
