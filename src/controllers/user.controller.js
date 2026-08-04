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
    updateAccountDetailsValidationSchema
} from "../validators/user.validator.js";
import jwt from "jsonwebtoken";

export const registerUser = asyncHandler(async (req, res) => {
    const validationResult = await registerUserPostRequestValidationSchema.safeParseAsync(req.body);
    if (validationResult.error)
        throw new API_Error(400, JSON.stringify(validationResult.error.format()));

    const { email, password, username, fullName } = validationResult.data;
    
    const existingUser = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (existingUser)
        throw new API_Error(409, "User with email or username already exists");

    let profileImageLocalPath = undefined;
    const coverImageLocalPath = req?.files?.coverImage[0]?.path;

    if (req.files && Array.isArray(req.files.profileImage) && req.files.profileImage.length > 0)
        profileImageLocalPath = req.files.profileImage[0].path;

    if (!profileImageLocalPath)
        throw new API_Error(400, "profile image is required");

    const profileImageOnCloudinary = await uploadFileOnCloudinary(profileImageLocalPath);
    const coverImageOnCloudinary = await uploadFileOnCloudinary(coverImageLocalPath);

    if (!profileImageOnCloudinary)
        throw new API_Error(400, "profile image uplaod on cloudinary failed!!!");
    
    const newUser = await User.create({
        email, password, username, fullName,
        profileImage: profileImageOnCloudinary.url,
        coverImage: coverImageOnCloudinary.url || "",
    });

    const createdNewUser = await User.findById(newUser._id).select("-password -refershToken -createdAt -updatedAt");

    return res
        .status(201)
        .json(
            new API_Response(201, createdNewUser, "User registered successfully")
        );
});

export const loginUser = asyncHandler(async (req, res) => {
    const validationResult = await loginUserPostRequestValidationSchema.safeParseAsync(req.body);
    if (validationResult.error)
        throw new API_Error(400, JSON.stringify(validationResult.error.format()));

    const { email, password } = validationResult.data;

    const existingUser = await User.findOne({ email });
    if (!existingUser)
        throw new API_Error(401, `User with email ${email} does not exist`);

    const correctPassword = await existingUser.isPasswordCorrect(password);
    if (!correctPassword)
        throw new API_Error(401, "Incorrect password");

    const accessToken = await existingUser.generateAccessToken();
    const refreshToken = await existingUser.generateRefreshToken();

    existingUser.refreshToken = refreshToken;
    await existingUser.save({ validateBeforeSave: false });

    const cookieOptions = {
        httpOnly: true,
        secure: true
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new API_Response(200, {existingUser, accessToken, refreshToken}, "User loggedin successfully")
        );
});

export const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                refreshToken: ""
            }
        },
        {
            returnDocument: "after"
        }
    );

    const cookieOptions = {
        httpOnly: true,
        secure: true
    };

    return res
        .status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(
            new API_Response(200, {}, "User logged out successfully")
        );
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken)
        throw new API_Error(401, "Unauthorized request");

    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(
        decodedToken?._id,
        {
            refreshToken: 1,
            email: 1,
            username: 1,
            fullName: 1,
        }
    );

    if (!user)
        throw new API_Error(401, "Invalid or expired token provided");
    if (incomingRefreshToken !== user.refreshToken)
        throw new API_Error(401, "provided token does not match with the user credentials");

    const newAccessToken = await user.generateAccessToken();
    const newRefreshToken = await user.generateRefreshToken();

    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    const cookieOptions = {
        httpOnly: true,
        secure: true
    };

    return res
        .status(200)
        .cookie("accessToken", newAccessToken, cookieOptions)
        .cookie("refreshToken", newRefreshToken, cookieOptions)
        .json(
            new API_Response(200, {}, "access token refreshed successfully")
        );
});

export const changeCurrentPassword = asyncHandler(async (req, res) => {
    const validationResult = await changeCurrentPasswordValidationSchema.safeParseAsync(req.body);
    if (validationResult.error)
        throw new API_Error(400, JSON.stringify(validationResult.error.format()));

    const { oldPassword, newPassword } = validationResult.data;

    const existingUser = await User.findById(
        req.user?._id,
        {
            password: 1
        }
    );

    const correctPassword = await existingUser.isPasswordCorrect(oldPassword);
    if (!correctPassword)
        throw new API_Error(401, "Incorrect current password");

    existingUser.password = newPassword;
    await existingUser.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(
            new API_Response(200, {}, "Password changed successfully")
        );
});

export const getCurrentUser  = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(
            new API_Response(200, req.user)
        );
});

export const updateAccountDetails = asyncHandler(async (req, res) => {
    const validationResult = await updateAccountDetailsValidationSchema.safeParseAsync(req.body);
    if (validationResult.error)
        throw new API_Error(400, JSON.stringify(validationResult.error.format()));

    const { newEmail, newFullName } = validationResult.data;

    if (!newEmail && !newFullName)
        throw new API_Error(400, "Provide either of new email or name to update details");

    const existingUser = await User.findById(req.user?._id).select(
        "-watchHistory -profileImage -coverImage -password -refreshToken -createdAt -updatedAt"
    );
    if (newFullName)
        existingUser.fullName = newFullName;

    if (newEmail){
        // check if user with newEmail already exists
        const userWithNewEmail = await User.findOne({ email: newEmail }, { email: 1 });
        if (userWithNewEmail)
            throw new API_Error(400, `User with email ${newEmail} already exists`);
        existingUser.email = newEmail;
    }
    await existingUser.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(
            new API_Response(200, existingUser, "User details updated successfully")
        );
});
