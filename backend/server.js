import express from "express"
import cors from "cors"
import path from "path"
import connectedDB from "./configs/db.js"
import dotenv from "dotenv"
import pinoHttp from 'pino-http'
import logger from "./configs/logger.js"
import userRouter from "./routes/userRoute.js"
import noteRouter from "./routes/noteRoutes.js"
import categoryRouter from "./routes/categoryRoutes.js"
dotenv.config()
const PORT = process.env.PORT || 5000
const app = express()
connectedDB()
app.use(pinoHttp({logger}))
app.use(cors())
app.use(express.json())

// Serve uploaded files (avatars, etc.)
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")))

app.use("/api/users", userRouter)
app.use("/api", noteRouter)
app.use("/api", categoryRouter)

app.use((err, req, res, next) => {
    logger.error({err}, "unhandled error")
    res.status(err.status || 500).json({message: err.message || "Server error"})
})

app.listen(PORT,()=>{
    logger.info(`Server is running on port ${PORT}`)
})
