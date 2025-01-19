import { v2 as cloudinary } from 'cloudinary'


cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
})


const uploadOnCloudinary = async function(file, type){
    try {
        if (!file) return null
        const response = await cloudinary.uploader.upload(file, type)
        console.log(`File uploaded successfully on cloudinary`)
        return response
    } catch (error) {
        return error
    }
}

const deleteFromCloudinary = async function(uri, type){
    try {
        if (!(uri || type)) return `URI and Type is required.`
        const [publicId] = uri?.split('/').pop().split('.')
        if (!publicId) return `Public-Id not found`

        const deleteRes = await cloudinary.uploader.destroy(publicId, {
           resource_type: type
        })
        console.log(`File ${uri} is removed from cloudinary`)
        return deleteRes
    } catch (error) {
        console.log(error)
    }
}

export {
    uploadOnCloudinary,
    deleteFromCloudinary
}