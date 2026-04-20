import express from "express"
import cors from "cors"
import connectedDB from "./configs/db.js"
import dotenv from "dotenv"
dotenv.config()
const PORT = process.env.PORT || 500
const app = express()
connectedDB()

app.use(cors())
app.use(express.json())

app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`)
})