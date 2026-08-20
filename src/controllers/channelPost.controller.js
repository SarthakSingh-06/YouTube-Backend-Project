import { asyncHandler } from "../utils/asyncHandler.js";
import { API_Response } from "../utils/api-response.js";
import { API_Error } from "../utils/api-error.js";
import { User } from "../models/user.model.js";
import { ChannelPosts } from "../models/channelPosts.model.js";
import { createOrUpdateChannelPostValidatorSchema } from "../validators/channelPost.validator.js";
import { Types as mongooseTypes } from "mongoose";

export const createChannelPost = asyncHandler(async (req, res) => {
    const validationResult =
        await createOrUpdateChannelPostValidatorSchema.safeParseAsync(req.body);
    if (validationResult.error)
        throw new API_Error(
            400,
            JSON.stringify(validationResult.error.format())
        );

    const { content } = validationResult.data;
    const newPost = await ChannelPosts.insertOne({
        owner: new mongooseTypes.ObjectId(req.user?._id),
        content,
    });

    return res.status(201).json(
        new API_Response(
            201,
            {
                postId: newPost._id,
            },
            "Post created successfully"
        )
    );
});

export const getUserChannelPosts = asyncHandler(async (req, res) => {
    const userId = req.params.userId;
    const existingUser = await User.findById(userId, {
        _id: 1,
    });

    if (!existingUser)
        throw new API_Error(
            404,
            `User with id ${userId} not found. Invalid user ID`
        );

    const userPosts = await ChannelPosts.aggregate([
        {
            $match: {
                owner: new mongooseTypes.ObjectId(userId),
            },
        },
        {
            $project: {
                _id: 1,
                content: 1,
            },
        },
    ]);

    return res
        .status(200)
        .json(new API_Response(200, userPosts, "Posts fetched successfully"));
});

export const updateChannelPost = asyncHandler(async (req, res) => {
    const postId = req.params.postId;
    const existingPost =
        await ChannelPosts.findById(postId).select("-createdAt -owner");
    if (!existingPost) throw new API_Error(404, `Post does not exist!`);

    const validationResult =
        await createOrUpdateChannelPostValidatorSchema.safeParseAsync(req.body);
    if (validationResult.error)
        throw new API_Error(
            400,
            JSON.stringify(validationResult.error.format())
        );

    const { content } = validationResult.data;
    const editedPost = await ChannelPosts.findOneAndUpdate(
        {
            _id: postId,
            owner: new mongooseTypes.ObjectId(req.user?._id),
        },
        {
            $set: {
                content,
            },
        },
        {
            returnDocument: "after",
        }
    ).select("-createdAt -owner");

    return res
        .status(200)
        .json(new API_Response(200, editedPost, "Post edited successfully"));
});

export const deleteChannelPost = asyncHandler(async (req, res) => {
    const postId = req.params.postId;
    const deletedPost = await ChannelPosts.findOneAndDelete({
        _id: postId,
        owner: new mongooseTypes.ObjectId(req.user._id),
    });
    if (!deletedPost) throw new API_Error(404, "Post does not exist");

    return res.status(200).json(
        new API_Response(
            200,
            {
                deletedPost,
            },
            "Post deleted successfully"
        )
    );
});
