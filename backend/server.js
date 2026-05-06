import express from "express"
import cors from "cors"
import connectedDB from "./configs/db.js"
import dotenv from "dotenv"
import userRouter from "./routes/userRoute.js"
dotenv.config()
const PORT = process.env.PORT || 5000
const app = express()
connectedDB()

app.use(cors())
app.use(express.json())

app.use("/api/users", userRouter)

app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`)
})