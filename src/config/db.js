import mongoose from "mongoose"
import { DB_NAME } from "./constants.js"
import dotenv from "dotenv"
dotenv.config()

const connectDB = async() => {
    try {
        const connectionInstance = await mongoose.connect(process.env.MONGODB_URI, {dbName: DB_NAME})
        console.log(`Successfully connected to ${connectionInstance.connection.host}`)
    } catch (error) {
        console.log(`Error connecting to MongoDB: ${error}. \n\nThe application is shutting down. Please resolve the issue and try again.`)
        process.exit(1)
    }
}

export default connectDB