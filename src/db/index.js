import "dotenv/config";
import { connect } from "mongoose";

export async function connectDB() {
    try{
        const connectionInstance = await connect(process.env.MONGODB_URI);
        console.log(`Database connection successful!`);
        console.log(`Host: ${connectionInstance.connection.host}`);
        console.log(`Port: ${connectionInstance.connection.port}`);
    }
    catch(error) {
        console.log("Connection to database failed!!!");
        console.log(error);
    };
};
