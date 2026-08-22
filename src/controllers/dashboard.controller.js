import { Types as mongooseTypes } from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Likes } from "../models/likes.model.js";
import { API_Error } from "../utils/api-error.js";
import { API_Response } from "../utils/api-response.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
    const channelId = new mongooseTypes.ObjectId(req.user._id);

    const [videoStats, subscriberStats, likeStats] = await Promise.all([
        Video.aggregate([
            { $match: { owner: channelId } },
            {
                $group: {
                    _id: null,
                    totalViews: { $sum: "$views" },
                    totalVideos: { $sum: 1 },
                },
            },
        ]),
        Subscription.aggregate([
            { $match: { channel: channelId } },
            { $count: "totalSubscribers" },
        ]),
        Likes.aggregate([
            { $match: { video: { $exists: true } } },
            {
                $lookup: {
                    from: "videos",
                    localField: "video",
                    foreignField: "_id",
                    as: "videoDetails",
                },
            },
            { $unwind: "$videoDetails" },
            { $match: { "videoDetails.owner": channelId } },
            { $count: "totalLikes" },
        ]),
    ]);

    const stats = {
        totalViews: videoStats[0]?.totalViews ?? 0,
        totalVideos: videoStats[0]?.totalVideos ?? 0,
        totalSubscribers: subscriberStats[0]?.totalSubscribers ?? 0,
        totalLikes: likeStats[0]?.totalLikes ?? 0,
    };

    return res
        .status(200)
        .json(new API_Response(200, stats, "Channel stats fetched successfully"));
});

const getChannelVideos = asyncHandler(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const aggregationOptions = { page, limit };

    const aggregate = Video.aggregate([
        {
            $match: {
                owner: new mongooseTypes.ObjectId(req.user?._id)
            }
        },
        {
            $project: {
                videoFile: 1,
                thumbnail: 1,
                title: 1,
                description: 1,
                duration: 1,
                views: 1
            }
        }
    ]);

    const allVideos = await Video.aggregatePaginate(aggregate, aggregationOptions);

    return res
        .status(200)
        .json(
            new API_Response(200, allVideos, "Your videos fetched successfully")
        );
});

export {
    getChannelStats,
    getChannelVideos
};
