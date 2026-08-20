import "dotenv/config";
import { connectDB } from "./db/index.js";
import { app } from "./app.js";
import { API_Error } from "./utils/api-error.js";

const PORT = process.env.PORT ?? 8000;

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.log("Failed to start the server!");
        throw new API_Error(500, error.message);
    });
