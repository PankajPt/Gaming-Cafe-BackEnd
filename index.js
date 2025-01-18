import dotenv from "dotenv"
import connectDB from "./config/db.js"
import app from "./app.js"

dotenv.config()

connectDB()
    .then(() => {
        app.listen(process.env.PORT || 5000, ()=> {
            console.log(`Server started on port: ${process.env.PORT || 5000}`)
        })
    })
    .catch((err) => {
        console.log(`MongoDB connection failed: ${err}`)
    })
    