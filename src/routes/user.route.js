import { Router } from "express";
import {
    registerUser,
    loginUser,
    logoutUser,
} from "../controllers/user.controller.js";
import { uplaod } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

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
router.post("/logout", verifyJWT, logoutUser);

export default router;
