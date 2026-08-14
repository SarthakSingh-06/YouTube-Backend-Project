import { asyncHandler } from "../utils/asyncHandler.js";
import { API_Response } from "../utils/api-response.js";
import { API_Error } from "../utils/api-error.js";
import {
    postVideoValidationSchema
} from "../validators/video.validation.js";
import { uploadFileOnCloudinary } from "../utils/cloudinaryFileUpload.js";
import { Video } from "../models/video.model.js";
import { Types as mongooseTypes } from "mongoose";

export const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
    //TODO: get all videos based on query, sort, pagination
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
