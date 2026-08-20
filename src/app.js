import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(express.json({ limit: "16kb" }));
app.use(express.static("public"));
app.use(express.urlencoded({ limit: "16kb", extended: true }));
app.use(cookieParser());

// configure CORS requests
app.use(
    cors({
        credentials: true,
        optionsSuccessStatus: 200,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        origin: process.env.CORS_ORIGIN.split(",") || "http://localhost:8000/",
    })
);

// import routes
import userRouter from "./routes/user.route.js";
import healthRouter from "./routes/health.route.js";
import channelPostRouter from "./routes/channelPost.route.js";
import commentRouter from "./routes/comment.route.js";
import videoRouter from "./routes/video.route.js";
import likeRouter from "./routes/like.route.js";
import playlistRouter from "./routes/playlist.route.js";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/health", healthRouter);
app.use("/api/v1/posts", channelPostRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/playlists", playlistRouter);

export { app };
