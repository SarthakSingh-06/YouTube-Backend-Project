import "dotenv/config";
import { asyncHandler } from "../utils/asyncHandler.js";
import { API_Error } from "../utils/api-error.js";
import { API_Response } from "../utils/api-response.js";
import { User } from "../models/user.model.js";
import { uploadFileOnCloudinary } from "../utils/cloudinaryFileUpload.js";
import {
    registerUserPostRequestValidationSchema,
    loginUserPostRequestValidationSchema,
    changeCurrentPasswordValidationSchema,
    updateAccountDetailsValidationSchema,
} from "../validators/user.validator.js";
import jwt from "jsonwebtoken";
import { deleteImageOnCloudinary } from "../utils/deleteFileOnCloudinary.js";
import mongoose from "mongoose";

export const registerUser = asyncHandler(async (req, res) => {
    const validationResult =
        await registerUserPostRequestValidationSchema.safeParseAsync(req.body);
    if (validationResult.error)
        throw new API_Error(
            400,
            JSON.stringify(validationResult.error.format())
        );

    const { email, password, username, fullName } = validationResult.data;

    const existingUser = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (existingUser)
        throw new API_Error(409, "User with email or username already exists");

    let profileImageLocalPath = undefined;
    let coverImageLocalPath = undefined;

    // check for profile image local path
    if (
        req.files &&
        Array.isArray(req.files.profileImage) &&
        req.files.profileImage.length > 0
    )
        profileImageLocalPath = req.files.profileImage[0].path;

    // check for cover image local path
    if (
        req.files &&
        Array.isArray(req.files.coverImage) &&
        req.files.coverImage.length > 0
    )
        coverImageLocalPath = req.files.coverImage[0].path;

    if (!profileImageLocalPath)
        throw new API_Error(400, "profile image is required");

        const profileImageOnCloudinary = await uploadFileOnCloudinary(profileImageLocalPath);
        const coverImageOnCloudinary = await uploadFileOnCloudinary(coverImageLocalPath);

    if (!profileImageOnCloudinary)
        throw new API_Error(
            400,
            "profile image uplaod on cloudinary failed!!!"
        );

    if (coverImageLocalPath && !coverImageOnCloudinary)
        throw new API_Error(
            400,
            "cover image uplaod on cloudinary failed!!!"
        );

    const newUser = await User.create({
        email,
        password,
        username,
        fullName,
        profileImage: profileImageOnCloudinary.url,
        coverImage: coverImageOnCloudinary?.url || "",
    });

    const createdNewUser = await User.findById(newUser._id).select(
        "-password -refershToken -createdAt -updatedAt"
    );

    return res
        .status(201)
        .json(
            new API_Response(
                201,
                createdNewUser,
                "User registered successfully"
            )
        );
});

export const loginUser = asyncHandler(async (req, res) => {
    const validationResult =
        await loginUserPostRequestValidationSchema.safeParseAsync(req.body);
    if (validationResult.error)
        throw new API_Error(
            400,
            JSON.stringify(validationResult.error.format())
        );

    const { email, password } = validationResult.data;

    const existingUser = await User.findOne({ email });
    if (!existingUser)
        throw new API_Error(401, `User with email ${email} does not exist`);

    const correctPassword = await existingUser.isPasswordCorrect(password);
    if (!correctPassword) throw new API_Error(401, "Incorrect password");

    const accessToken = await existingUser.generateAccessToken();
    const refreshToken = await existingUser.generateRefreshToken();

    existingUser.refreshToken = refreshToken;
    await existingUser.save({ validateBeforeSave: false });

    const cookieOptions = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new API_Response(
                200,
                { existingUser, accessToken, refreshToken },
                "User loggedin successfully"
            )
        );
});

export const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                refreshToken: "",
            },
        },
        {
            returnDocument: "after",
        }
    );

    const cookieOptions = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(new API_Response(200, {}, "User logged out successfully"));
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken =
        req.cookies.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) throw new API_Error(401, "Unauthorized request");

    const decodedToken = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id, {
        refreshToken: 1,
        email: 1,
        username: 1,
        fullName: 1,
    });

    if (!user) throw new API_Error(401, "Invalid or expired token provided");
    if (incomingRefreshToken !== user.refreshToken)
        throw new API_Error(
            401,
            "provided token does not match with the user credentials"
        );

    const newAccessToken = await user.generateAccessToken();
    const newRefreshToken = await user.generateRefreshToken();

    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    const cookieOptions = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", newAccessToken, cookieOptions)
        .cookie("refreshToken", newRefreshToken, cookieOptions)
        .json(new API_Response(200, {}, "access token refreshed successfully"));
});

export const changeCurrentPassword = asyncHandler(async (req, res) => {
    const validationResult =
        await changeCurrentPasswordValidationSchema.safeParseAsync(req.body);
    if (validationResult.error)
        throw new API_Error(
            400,
            JSON.stringify(validationResult.error.format())
        );

    const { oldPassword, newPassword } = validationResult.data;

    const existingUser = await User.findById(req.user?._id, {
        password: 1,
    });

    const correctPassword = await existingUser.isPasswordCorrect(oldPassword);
    if (!correctPassword)
        throw new API_Error(401, "Incorrect current password");

    existingUser.password = newPassword;
    await existingUser.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new API_Response(200, {}, "Password changed successfully"));
});

export const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(new API_Response(200, req.user));
});

export const updateAccountDetails = asyncHandler(async (req, res) => {
    const validationResult =
        await updateAccountDetailsValidationSchema.safeParseAsync(req.body);
    if (validationResult.error)
        throw new API_Error(
            400,
            JSON.stringify(validationResult.error.format())
        );

    const { newEmail, newFullName } = validationResult.data;

    if (!newEmail && !newFullName)
        throw new API_Error(
            400,
            "Provide either of new email or name to update details"
        );

    const existingUser = await User.findById(req.user?._id).select(
        "-watchHistory -profileImage -coverImage -password -refreshToken -createdAt -updatedAt"
    );
    if (newFullName) existingUser.fullName = newFullName;

    if (newEmail) {
        // check if user with newEmail already exists
        const userWithNewEmail = await User.findOne(
            { email: newEmail },
            { email: 1 }
        );
        if (userWithNewEmail)
            throw new API_Error(
                400,
                `User with email ${newEmail} already exists`
            );
        existingUser.email = newEmail;
    }
    await existingUser.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(
            new API_Response(
                200,
                existingUser,
                "User details updated successfully"
            )
        );
});

export const updateUserProfileImage = asyncHandler(async (req, res) => {
    const newProfileImageLocalPath = req?.file?.path;
    if (!newProfileImageLocalPath)
        throw new API_Error(
            404,
            "Path to new profile image on local server not found"
        );

    const existingUser = await User.findById(req.user?.id, { profileImage: 1 });

    const oldProfileImageURL = existingUser.profileImage; // old cloudinary URL

    const newProfileImageOnCloudinary = await uploadFileOnCloudinary(
        newProfileImageLocalPath
    );
    if (!newProfileImageOnCloudinary)
        throw new API_Error(
            500,
            "Uploading new profile image on cloudinary failed!"
        );

    const newProfileImageURL = newProfileImageOnCloudinary.url; // new cloudinary URL

    // delete old profile image on cloudinary
    await deleteImageOnCloudinary(oldProfileImageURL);

    existingUser.profileImage = newProfileImageURL;
    await existingUser.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(
            new API_Response(
                200,
                existingUser,
                "Profile image updated successfully"
            )
        );
});

export const updateUserCoverImage = asyncHandler(async (req, res) => {
    const newCoverImageLocalPath = req?.file?.path;
    if (!newCoverImageLocalPath)
        throw new API_Error(
            404,
            "Path to new cover image on local server not found!"
        );

    const existingUser = await User.findById(req.user?.id, { coverImage: 1 });

    const oldCoverImageURL = existingUser.coverImage; // old cloudinary URL

    const newCoverImageOnCloudinary = await uploadFileOnCloudinary(
        newCoverImageLocalPath
    );
    if (!newCoverImageOnCloudinary)
        throw new API_Error(
            500,
            "Uploading new cover image on cloudinary failed!"
        );

    const newCoverImageURL = newCoverImageOnCloudinary.url;

    // delete old cover image on cloudinary
    await deleteImageOnCloudinary(oldCoverImageURL);

    existingUser.coverImage = newCoverImageURL;
    await existingUser.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(
            new API_Response(
                200,
                existingUser,
                "Cover image updated successfully"
            )
        );
});

export const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;
    if (!username?.trim()) throw new API_Error(400, "Username is missing");

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase(),
            },
        },
        {
            $lookup: {
                from: "Subscription",
                localField: "$_id",
                foreignField: "channel",
                as: "subscribers",
            },
        },
        {
            $lookup: {
                from: "Subscription",
                localField: "$_id",
                foreignField: "subscriber",
                as: "subscribedTo",
            },
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers",
                },
                subscribedToCount: {
                    $size: "$subscribedTo",
                },
                isSubscribed: {
                    $cond: {
                        if: {
                            // check if req.user._id is present as a subscriber to channel
                            $in: [req.user?._id, "$subscribers.subscriber"],
                            then: true,
                            else: false,
                        },
                    },
                },
            },
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                email: 1,
                subscribersCount: 1,
                subscribedToCount: 1,
                isSubscribed: 1,
                coverImage: 1,
                profileImage: 1,
            },
        },
    ]);

    console.log("CHANNEL:", channel);

    if (!channel?.length) throw new API_Error(404, "Channel does not exist");

    return res
        .status(200)
        .json(
            new API_Response(200, channel, "User channel fetched successfully")
        );
});

export const getUserWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id),
            },
        },
        {
            $lookup: {
                from: "Video",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory", // overwrite the existing field
                pipeline: [
                    {
                        $lookup: {
                            from: "User",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner", // overwrite the existing field
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        email: 1,
                                        profileImage: 1,
                                    },
                                },
                                {
                                    $addFields: {
                                        owner: {
                                            $first: "$owner",
                                        },
                                    },
                                },
                            ],
                        },
                    },
                ],
            },
        },
    ]);

    return res
        .status(200)
        .json(
            new API_Response(
                200,
                user[0].watchHistory,
                "Watch history fetched successfully"
            )
        );
});
