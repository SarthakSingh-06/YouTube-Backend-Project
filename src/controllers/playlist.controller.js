import { Playlists } from "../models/playlist.model.js";
import { API_Error } from "../utils/api-error.js";
import { API_Response } from "../utils/api-response.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { isValidObjectId, Types as mongooseTypes } from "mongoose";

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
    //TODO: get user playlists
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
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
    // TODO: remove video from playlist
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
