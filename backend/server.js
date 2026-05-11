import express from "express"
import cors from "cors"
import connectedDB from "./configs/db.js"
import dotenv from "dotenv"
import pinoHttp from 'pino-http'
import logger from "./configs/logger.js"
dotenv.config()
const PORT = process.env.PORT || 5000
const app = express()
connectedDB()
app.use(pinoHttp({logger}))
app.use(cors())
app.use(express.json())

app.listen(PORT,()=>{
    logger.info(`Server is running on port ${PORT}`)
})