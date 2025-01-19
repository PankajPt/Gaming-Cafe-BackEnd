import dotenv from "dotenv"
import connectDB from "./src/config/db.js"
import app from "./app.js"

dotenv.config()

connectDB()
    .then(() => {
        app.listen(process.env.PORT || 5000, ()=> {
            console.log(`Server is running on http://localhost:${process.env.PORT || 5000}`)
        })
    })
    .catch((err) => {
        console.log(`MongoDB connection failed: ${err}`)
    })
    