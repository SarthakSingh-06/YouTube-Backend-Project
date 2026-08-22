import { Types as mongooseTypes } from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Likes } from "../models/likes.model.js";
import { API_Error } from "../utils/api-error.js";
import { API_Response } from "../utils/api-response.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
});

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
});

export {
    getChannelStats,
    getChannelVideos
};
