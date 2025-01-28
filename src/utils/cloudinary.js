import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
})

const removeTempFile = async(file) => {
    await file && fs.unlinkSync(file)
}

const uploadOnCloudinary = async function(file, type){
    try {
        if (!file) return null
        const response = await cloudinary.uploader.upload(file, {
            resource_type: type
        })
        await removeTempFile(file)
        console.log(`File uploaded successfully on cloudinary`)
        return response
    } catch (error) {
        await removeTempFile(file)
        fs.unlinkSync(file)
        console.log('Error: Appear while uploading on cloudinary')
        console.log(error)
        return false
    }
}

const deleteFromCloudinary = async function(uri, publicId, type){
    try {
        if (!((uri || publicId) && type)) {
            console.log(`URI and Type is required.`)
            return false
        }
        if (!publicId){
            [publicId] = uri?.split('/').pop().split('.')
            if (!publicId) {
                console.log(`Public-Id not found`)
                return false
            }
        }

        const deleteRes = await cloudinary.uploader.destroy(publicId, {
           resource_type: type
        })
        console.log(`File ${publicId} is removed from cloudinary`)
        return deleteRes
    } catch (error) {
        console.log(error)
    }
}

export {
    uploadOnCloudinary,
    deleteFromCloudinary
}