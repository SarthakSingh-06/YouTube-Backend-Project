import { asyncHandler } from "../utils/asyncHandler.js";
import { API_Response } from "../utils/api-response.js";

export const healthCheck = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(
            new API_Response(
                200,
                { status: "OK" },
                "Server is up and running..."
            )
        );
});
