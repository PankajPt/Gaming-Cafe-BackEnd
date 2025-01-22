import jwt from 'jsonwebtoken'
import User from '../models/user.model.js'
import asyncHandler from '../utils/asyncHandler.js'
import ApiError from '../utils/apiError.js'
import {rolePermissions} from '../config/constants.js'

const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        if (!token) {
            throw new ApiError(401, 'Unauthorized request')
        }
    
        const decodedToken = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        if (!decodedToken) {
            throw new ApiError(401, 'Invalid Access Token')
        }
    
        const user = await User.findById(decodedToken?._id).select('-password -refreshToken')
        if (!user) {
            throw new ApiError(401, 'User not found')
        }
    
        req.user = user
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || `Invalid Access Token`)   
    }
})

const confirmAdminRole = asyncHandler(async(req, _, next)=>{
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
    if (!token){
        throw new ApiError(401, "Invalid request: Token not found.")
    }
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    if(!decodedToken){
        throw new ApiError(401, "Invalid access token")
    }

    const user = await User.findById(decodedToken._id).select('-password -refreshToken')
    if(!user){
        throw new ApiError(401, 'User not found')
    }

    if(user.role !== 'admin'){
        throw new ApiError(403, "Access denied: The user does not have permission to view this page.")
    }

    if(user.permissions.length === 0 || user.permissions.length < rolePermissions.admin.length){
        user.permissions = rolePermissions.admin
        await user.save()
    }

    user.permissions = rolePermissions.admin
    req.user = user
    next()
})

const confirmManagerRole = asyncHandler(async(req, _, next)=>{
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
    if (!token){
        throw new ApiError(401, "Invalid request: Token not found.")
    }
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    if(!decodedToken){
        throw new ApiError(401, "Invalid access token")
    }

    const user = await User.findById(decodedToken._id).select('-password -refreshToken')
    if(!user){
        throw new ApiError(401, 'User not found')
    }
    if(user.role !== 'manager'){
        throw new ApiError(403, "Access denied: The user does not have permission to view this page.")
    }
    req.user = user
    next()
})

export { verifyJWT, confirmAdminRole, confirmManagerRole }