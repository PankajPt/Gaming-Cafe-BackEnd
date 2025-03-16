import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'
import { logger } from './logger.js'

const timeout = Number(process.env.CLOUD_TIMEOUT)
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
    timeout
})

const removeTempFile = async(file) => {
    await file && fs.unlinkSync(file)
}

const uploadOnCloudinary = async function(file, type){
    try {
        if (!file) return null
        const response = await cloudinary.uploader.upload(file, { resource_type: type, timeout })    
        logger.info(`File uploaded successfully on cloudinary`, response)
        return response
    } catch (error) {
        logger.error('Appear while uploading on cloudinary', error)
        return false
    } finally {
        await removeTempFile(file)
    }
}

const deleteFromCloudinary = async function(uri, publicId, type){
    try {
        if (!((uri || publicId) && type)) {
            logger.warn(`URI and Type is required.`)
            return false
        }
        if (!publicId){
            [publicId] = uri?.split('/').pop().split('.')
            if (!publicId) {
                logger.warn(`Public-Id not found`)
                return false
            }
        }

        const deleteRes = await cloudinary.uploader.destroy(publicId, {
           resource_type: type
        })
        logger.info(`File ${publicId} is removed from cloudinary`)
        return deleteRes
    } catch (error) {
        logger.error(`[${publicId}]`, error)
        return false
    }
}

export {
    uploadOnCloudinary,
    deleteFromCloudinary
}