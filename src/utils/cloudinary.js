import { v2 as cloudinary } from 'cloudinary'


cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
})


const uploadOnCloudinary = async function(file, type){
    if (!file) return null
    const response = await cloudinary.uploader.upload(file, type)
    console.log(`File uploaded successfully on cloudinary`)
    return response
}

export {
    uploadOnCloudinary
}