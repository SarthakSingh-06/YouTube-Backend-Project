import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    createChannelPost,
    deleteChannelPost,
    getUserChannelPosts,
    updateChannelPost,
} from "../controllers/channelPost.controller.js";

const router = Router();

router.use(verifyJWT);

router.post("/", createChannelPost);
router.get("/user/:userId", getUserChannelPosts);

router.route("/:postId").delete(deleteChannelPost).patch(updateChannelPost);

export default router;
