import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { uplaod } from "../middlewares/multer.middleware.js";

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

export default router;
