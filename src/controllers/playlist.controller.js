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
    //TODO: get playlist by id
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
    // TODO: delete playlist
});

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;
    //TODO: update playlist
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
