import dotenv from "dotenv"
import cors from "cors"
import cookieParser from "cookie-parser"
import express from "express"

dotenv.config()
const app = express()

const corsOptions = {
    origin: process.env.CORS_ORIGIN,
    credentials: true
}

app.use(cors(corsOptions))
app.use(express.json({limit: '16kb'}))
app.use(express.urlencoded({extended: true, limit: '16kb'}))
app.use(express.static('public'))
app.use(cookieParser())

// user route

import userRouter from "./src/routes/user.route.js"
app.use('/api/v1/users', userRouter)

// admin route
import adminRouter from './src/routes/admin.route.js'
app.use('/api/v1/admin', adminRouter)

// manager route
import managerRouter from './src/routes/manager.route.js'
app.use('/api/v1/manager', managerRouter)

// verification route





export default app