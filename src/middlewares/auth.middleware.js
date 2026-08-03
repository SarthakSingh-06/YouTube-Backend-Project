import "dotenv/config";
import { asyncHandler } from "../utils/asyncHandler.js";
import { API_Error } from "../utils/api-error.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies.accessToken || req.headers["authorization"]?.replace("Bearer ", "");
        if (!token)
            throw new API_Error(401, "Access token not found. Unauthorized request");
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id).select(
            "-profileImage -coverImage -password -refreshToken -createdAt -updatedAt"
        );
        if (!user)
            throw new API_Error(401, "Token is either invalid or expired");
    
        req.user = user;
        next();
    } catch (error) {
        throw new API_Error(401, error.message);
    }
});
