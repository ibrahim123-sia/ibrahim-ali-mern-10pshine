import express from "express"
import cors from "cors"
import connectedDB from "./configs/db.js"
import dotenv from "dotenv"
import pinoHttp from 'pino-http'
import logger from "./configs/logger.js"
import userRouter from "./routes/userRoute.js"
import noteRouter from "./routes/noteRoutes.js"
dotenv.config()
const PORT = process.env.PORT || 5000
const app = express()
connectedDB()
app.use(pinoHttp({logger}))
app.use(cors())
app.use(express.json())

app.use("/api/users", userRouter)
app.use("/api", noteRouter)

app.use((err, req, res, next) => {
    logger.error({err}, "unhandled error")
    res.status(err.status || 500).json({message: err.message || "Server error"})
})

app.listen(PORT,()=>{
    logger.info(`Server is running on port ${PORT}`)
})
