import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(express.json({ limit: "128kb" }));
app.use(express.static("public"));
app.use(express.urlencoded({ limit: "128kb", extended: true }));

// configure CORS requests
app.use(cors({
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    origin: process.env.CORS_ORIGIN.split(",") || "http://localhost:8000/"
}));

// import routes
import userRouter from "./routes/user.route.js";

app.use("/api/v1/users", userRouter);

export { app };
