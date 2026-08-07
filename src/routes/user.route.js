import { Router } from "express";
import {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserProfileImage,
    updateUserCoverImage,
    getUserChannelProfile,
    getUserWatchHistory
} from "../controllers/user.controller.js";
import { uplaod } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// unsecured routes
router.post("/register",
    uplaod.fields([
        {
            name: "profileImage",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser);

router.post("/login", loginUser);
router.post("/refresh-token", refreshAccessToken);

// secured routes
router.post("/logout", verifyJWT, logoutUser);
router.post("/change-password", verifyJWT, changeCurrentPassword);
router.get("/current-user", verifyJWT, getCurrentUser);
router.patch("/update", verifyJWT, updateAccountDetails);

router.patch(
    "/update-profile-image",
    verifyJWT,
    uplaod.single("newProfileImage"),
    updateUserProfileImage
);

router.patch(
    "/update-cover-image",
    verifyJWT,
    uplaod.single("newCoverImage"),
    updateUserCoverImage
);

router.get("/history", verifyJWT, getUserWatchHistory);
router.get("/c/:username", verifyJWT, getUserChannelProfile);

export default router;
