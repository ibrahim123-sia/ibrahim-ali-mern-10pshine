import mongoose from "mongoose";

const connectedDB= async()=>{
    try {
        mongoose.connection.on("connected",()=>{
            console.log("MongoDB connected successfully");
        })
        await mongoose.connect(process.env.MONGO_URI)
    } catch (error) {
        console.error("Database connection failed:", error);
        process.exit(1);
    }
}

export default connectedDB;