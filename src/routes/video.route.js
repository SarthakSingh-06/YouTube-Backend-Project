import { Router } from 'express';
import {
    deleteVideo,
    getAllVideos,
    getVideoById,
    publishVideo,
    togglePublishStatus,
    updateVideo,
} from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { uplaod } from "../middlewares/multer.middleware.js";

const router = Router();

router
    .route("/")
    .get(getAllVideos)
    .post(
        verifyJWT,
        uplaod.fields([
            {
                name: "video",
                maxCount: 1
            },
            {
                name: "thumbnail",
                maxCount: 1
            }
        ]),
        publishVideo
    );
    
router
    .route("/:videoId")
    .get(getVideoById)
    .delete(verifyJWT, deleteVideo)
    .patch(
        verifyJWT,
        uplaod.single("thumbnail"),
        updateVideo
    );

router.patch("/togglePublishStatus/:videoId", verifyJWT, togglePublishStatus);

export default router;
