import { Playlists } from "../models/playlist.model.js";
import { API_Error } from "../utils/api-error.js";
import { API_Response } from "../utils/api-response.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { isValidObjectId, Types as mongooseTypes } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
    const { name="", description="" } = req.body;
    if (!name.trim() || !description.trim())
        throw new API_Error(400, "Provide a name and description for your playlist");

    const existingPlaylist = await Playlists.findOne({
        name, description,
        owner: new mongooseTypes.ObjectId(req.user?._id)
    },
    {
        _id: 1
    });

    if (existingPlaylist)
        throw new API_Error(400, "Playlist alerady exists");

    const newPlaylist = await Playlists.insertOne({
        name, description,
        owner: new mongooseTypes.ObjectId(req.user?._id),
        video: []
    });

    return res
        .status(201)
        .json(
            new API_Response(201, newPlaylist, "Playlist created successfully")
        );
});

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    if (!isValidObjectId(userId))
        throw new API_Error(400, "Provided user id is not a valid mongodb id");

    const existingUser = await User.findById(
        userId,
        {
            _id: 1
        }
    );
    if (!existingUser)
        throw new API_Error(400, `User with id ${userId} does not exist`);

    const userPlaylists = await Playlists.aggregate([
        {
            $match: {
                owner: new mongooseTypes.ObjectId(userId)
            }
        },
        {
            $project: {
                name: 1,
                description: 1,
                videos: 1
            }
        }
    ]);

    return res
        .status(200)
        .json(
            new API_Response(200, userPlaylists, "user playlists fetched successfully")
        );
});

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    if (!playlistId)
        throw new API_Error(400, "Provide playlist id to proceed.");
    if (!isValidObjectId(playlistId))
        throw new API_Error(400, "Provided id is not a valid mongodb object id");

    const existingPlaylist = await Playlists.findById(playlistId).select("-__v");

    if (!existingPlaylist)
        throw new API_Error(404, `Playlist does not exist`);

    return res
        .status(200)
        .json(
            new API_Response(200, existingPlaylist, "playlist fetched successfully")
        );
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if (!isValidObjectId(playlistId))
        throw new API_Error(400, "Provided playlist id is not a valid mongodb id");
    if (!isValidObjectId(videoId))
        throw new API_Error(400, "Provided video id is not a valid mongodb id");

    const existingPlaylist = await Playlists.findOne(
        {
            _id: new mongooseTypes.ObjectId(playlistId),
            owner: new mongooseTypes.ObjectId(req.user?._id)
        },
        {
            videos: 1,
            name: 1
        }
    );

    if (!existingPlaylist)
        throw new API_Error(404, `Playlist does not exist!`);

    const existingVideo = await Video.findById(videoId,
        {
            _id: 1,
            title: 1,
            description: 1
        }
    );

    if (!existingVideo)
        throw new API_Error(404, "Video does not exist");

    existingPlaylist.videos.push(new mongooseTypes.ObjectId(existingVideo._id));
    await existingPlaylist.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(
            new API_Response(
                200,
                {
                    playlist: existingPlaylist,
                    video: existingVideo
                },
                "Video added to playlist"
            )
        );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
    if (!isValidObjectId(playlistId))
        throw new API_Error(400, "Provided playlist id is not a valid mongodb id");
    if (!isValidObjectId(videoId))
        throw new API_Error(400, "Provided video id is not a valid mongodb id");

    const existingPlaylist = await Playlists.findOne(
        {
            _id: new mongooseTypes.ObjectId(playlistId),
            owner: new mongooseTypes.ObjectId(req.user?._id)
        },
        {
            videos: 1
        }
    );

    if (!existingPlaylist)
        throw new API_Error(404, `Playlist does not exist!`);

    const existingVideo = await Video.findById(videoId,
        {
            _id: 1,
            title: 1,
            description: 1
        }
    );

    if (!existingVideo || !existingPlaylist.videos.includes(existingVideo?._id))
        throw new API_Error(404, "Video does not exist");

    const videoIndex = existingPlaylist.videos.indexOf(existingVideo._id);
    existingPlaylist.videos.splice(videoIndex, 1);
    await existingPlaylist.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(
            new API_Response(
                200,
                existingPlaylist,
                "Video removed from playlist"
            )
        );
});

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    const existingPlaylist = await Playlists.findOneAndDelete({
        _id: new mongooseTypes.ObjectId(playlistId),
        owner: new mongooseTypes.ObjectId(req.user?._id)
    }).select("-__v");

    if (!existingPlaylist)
        throw new API_Error(404, "Playlist does not exist");

    return res
        .status(200)
        .json(
            new API_Response(200, existingPlaylist, "Playlist deleted")
        );
});

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name="", description="" } = req.body;

    if (!name.trim() && !description.trim())
        throw new API_Error(400, "Provide one of new name or description to update playlist details.");
    
    const existingPlaylist = await Playlists.findOne({
        _id: new mongooseTypes.ObjectId(playlistId),
        owner: new mongooseTypes.ObjectId(req.user?._id),
    }).select("-video -__v");

    if (!existingPlaylist)
        throw new API_Error(404, "Playlist does not exist");

    if (existingPlaylist.name != name && name !== "")
        existingPlaylist.name = name;
    if (existingPlaylist.description != description && description !== "")
        existingPlaylist.description = description;

    await existingPlaylist.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(
            new API_Response(200, existingPlaylist, "Playlist details updated")
        )
});

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist,
};
