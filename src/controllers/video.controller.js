import { asyncHandler } from "../utils/asyncHandler.js";
import { API_Response } from "../utils/api-response.js";
import { API_Error } from "../utils/api-error.js";
import {
    postVideoValidationSchema,
    getAllVideosValidationSchema
} from "../validators/video.validation.js";
import { uploadFileOnCloudinary } from "../utils/cloudinaryFileUpload.js";
import { Video } from "../models/video.model.js";
import { Types as mongooseTypes } from "mongoose";

export const getAllVideos = asyncHandler(async (req, res) => {
    const validationResult = await getAllVideosValidationSchema.safeParseAsync(req.query);
    if (validationResult.error)
        throw new API_Error(400, JSON.stringify(validationResult.error.format()));

    const { query, sortBy, sortType, userId } = validationResult.data;
    const page = Number(validationResult.data.page) ?? 1;
    const limit = Number(validationResult.data.limit) ?? 10;

    const aggregationOptions = { page, limit };

    const matchStage = {
        isPublished: true
    };

    if (query) {
        // fetch videos related to a particular query if provided
        matchStage.$or = [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } }
        ];
    };

    if (userId) {
        // If userId is given, all fetched videos must belong to that particular user only otherwise get the relevant videos from all the present users
        matchStage.owner = new mongoose.Types.ObjectId(userId);
    };

    const aggregate = Video.aggregate([
        {
            $match: matchStage
        },
        {
            $sort: {
                // get the sorting order
                [sortBy]: sortType.toLowerCase() === "asc" ? 1 : -1
            }
        }
    ]);

    const fetchedVideos = await Video.aggregatePaginate(aggregate, aggregationOptions);

    return res
        .status(200)
        .json(
            new API_Response(200, fetchedVideos, "Videos fetched successfully")
        );
});

export const publishVideo = asyncHandler(async (req, res) => {
    const validationResult = await postVideoValidationSchema.safeParseAsync(req.body);
    if (validationResult.error)
        throw new API_Error(400, JSON.stringify(validationResult.error.format()));

    const { title, description } = validationResult.data;
    const videoFileLocalPath = req?.files?.video[0]?.path;
    const videoThumbnailLocalPath = req?.files?.thumbnail[0]?.path;

    if (!videoFileLocalPath)
        throw new API_Error(400, "Upload failed, video not found on local server");
    if (!videoThumbnailLocalPath)
        throw new API_Error(400, "Upload failed, video thumbnail not found on local server");

    const videoFileOnCloudinary = await uploadFileOnCloudinary(videoFileLocalPath);
    const videoThumbnailOnCloudinary = await uploadFileOnCloudinary(videoThumbnailLocalPath);

    const newVideo = await Video.insertOne({
        videoFile: videoFileOnCloudinary.secure_url,
        thumbnail: videoThumbnailOnCloudinary.secure_url,
        title,
        description,
        duration: Math.ceil(Math.round(videoFileOnCloudinary.duration)),
        owner: new mongooseTypes.ObjectId(req.user._id)
    });

    return res
        .status(201)
        .json(
            new API_Response(201, newVideo, "Video uploaded successfully")
        );
});

export const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //TODO: get video by id
});

export const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //TODO: update video details like title, description, thumbnail
});

export const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //TODO: delete video
});

export const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
});
