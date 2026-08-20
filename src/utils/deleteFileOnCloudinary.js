import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";
import { API_Error } from "./api-error.js";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const deleteImageOnCloudinary = async (fileURL) => {
    try {
        const publicId = fileURL.split("/").at(-1).split(".")[0];
        const deleted = await cloudinary.uploader.destroy(publicId, {
            resource_type: "image",
            invalidate: true,
            type: "upload",
        });

        return deleted;
    } catch (error) {
        throw new API_Error(500, error.message);
    }
};

export const deleteVideoOnCloudinary = async (fileURL) => {
    try {
        const publicId = fileURL.split("/").at(-1).split(".")[0];
        const deleted = await cloudinary.uploader.destroy(publicId, {
            resource_type: "video",
            invalidate: true,
            type: "upload",
        });

        return deleted;
    } catch (error) {
        throw new API_Error(500, error.message);
    }
};
