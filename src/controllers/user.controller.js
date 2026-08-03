import { asyncHandler } from "../utils/asyncHandler.js";
import { API_Error } from "../utils/api-error.js";
import { API_Response } from "../utils/api-response.js";
import { User } from "../models/user.model.js";
import { uploadFileOnCloudinary } from "../utils/cloudinaryFileUpload.js";
import { registerUserPostRequestValidationSchema } from "../validators/user.validator.js";

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
