import "dotenv/config";
import fs from "node:fs";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadFileOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        const uplaodResponse = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });
        fs.unlinkSync(localFilePath);
        return uplaodResponse;
    } catch (error) {
        fs.unlinkSync(localFilePath);
        return null;
    }
};
