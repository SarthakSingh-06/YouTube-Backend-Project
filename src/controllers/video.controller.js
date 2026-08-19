import { asyncHandler } from "../utils/asyncHandler.js";
import { API_Response } from "../utils/api-response.js";
import { API_Error } from "../utils/api-error.js";
import {
    postVideoValidationSchema,
    getAllVideosValidationSchema,
    updateVideoDetailsValidationSchema
} from "../validators/video.validation.js";
import { uploadFileOnCloudinary } from "../utils/cloudinaryFileUpload.js";
import {
    deleteImageOnCloudinary,
    deleteVideoOnCloudinary
} from "../utils/deleteFileOnCloudinary.js";
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
    
    const existingVideo = await Video.findOne({
        _id: new mongooseTypes.ObjectId(videoId),
        isPublished: true,
    });

    if (!existingVideo)
        throw new API_Error(404, `Video with id ${videoId} does not exist`);

    return res
        .status(200)
        .json(
            new API_Response( 200, existingVideo, "Video fetched successfully")
        );
});

export const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const validationResult = await updateVideoDetailsValidationSchema.safeParseAsync(req.body);
    if (validationResult.error)
        throw new API_Error(400, JSON.stringify(validationResult.error.format()));

    const { title, description } = validationResult.data;

    const existingVideo = await Video.findOne({
        _id: new mongooseTypes.ObjectId(videoId),
        owner: new mongooseTypes.ObjectId(req.user?._id),
    }).select(
        "-duration -views -isPublished -owner -createdAt -updatedAt"
    );

    if (!existingVideo)
        throw new API_Error(404, `Video with id ${videoId} does not exist`);

    if (title && existingVideo.title !== title) {
        existingVideo.title = title
    }

    if (description && existingVideo.description !== description) {
        existingVideo.description = description
    }

    // logic to update thumbnail
    let newThumbnailLocalPath = undefined;
    if (req.file && req.file.path) {
        newThumbnailLocalPath = req.file.path;
    }
    if (newThumbnailLocalPath) {
        const oldThumbnail = existingVideo.thumbnail;
        try {
            await deleteImageOnCloudinary(oldThumbnail);
            const newThumbnailOnCloudinary = await uploadFileOnCloudinary(newThumbnailLocalPath);
            existingVideo.thumbnail = newThumbnailOnCloudinary.secure_url;
        } catch (error) {
            throw new API_Error(500, "Failed to update video thumbnail.");
        }
    }
    await existingVideo.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(
            new API_Response(200, existingVideo, "Video updated successfully")
        );
});

export const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!videoId)
        throw new API_Error(400, "Video id is requied to change publish status");

    const existingVideo = await Video.findOneAndDelete({
        _id: new mongooseTypes.ObjectId(videoId),
        owner: new mongooseTypes.ObjectId(req.user?._id),
    });

    if (!existingVideo)
        throw new API_Error(404, `Video with id ${videoId} does not exist`);

    try {
        // delete video and thumbnail from Cloudinary
        await deleteVideoOnCloudinary(existingVideo.videoFile);
        await deleteImageOnCloudinary(existingVideo.thumbnail);
    }
    catch(error){
        throw new API_Error(error);
    }

    return res
        .status(200)
        .json(
            new API_Response( 200, {}, "Video deleted successfully")
        );
});

export const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!videoId)
        throw new API_Error(400, "Video id is requied to change publish status");

    const existingVideo = await Video.findOne({
        _id: new mongooseTypes.ObjectId(videoId),
        owner: new mongooseTypes.ObjectId(req.user?._id)
    }).select(
        "-videoFile -thumbnail -description -duration -createdAt -updatedAt"
    );

    if (!existingVideo)
        throw new API_Error(404, `Video with id ${videoId} does not exist`);

    existingVideo.isPublished = !existingVideo.isPublished;
    await existingVideo.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(
            new API_Response( 200, existingVideo, "Video publish status changed successfully")
        );
});
