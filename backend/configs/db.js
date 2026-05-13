import mongoose from "mongoose";
import logger from "./logger.js";

const connectedDB = async () => {
    try {
        mongoose.connection.on("connected", () => {
            logger.info("MongoDB connected successfully");
        })
        await mongoose.connect(process.env.MONGO_URI)
    } catch (error) {
        logger.error({err: error}, "Database connection failed")
        process.exit(1);
    }
}

export default connectedDB;
