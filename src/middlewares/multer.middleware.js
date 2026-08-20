import multer from "multer";
import { API_Error } from "../utils/api-error.js";

const storage = multer.diskStorage({
    destination(req, file, callback) {
        callback(null, "public/temp");
    },
    filename(req, file, callback) {
        const filename = file.originalname.split(".")[0];
        const ext = file.originalname.replace(filename, "");
        callback(null, `${filename}-${Date.now()}${ext}`);
    },
});

export const uplaod = multer({ storage });
