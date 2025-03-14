import jwt from 'jsonwebtoken'
import User from '../models/user.model.js'
import asyncHandler from '../utils/asyncHandler.js'
import ApiError from '../utils/apiError.js'
import ApiResponse from '../utils/apiResponse.js'
import { logger } from '../utils/logger.js'


const verifyJWT = asyncHandler(async (req, res, next) => {
    logger.info(`[JWT Middleware] Checking request: ${req.originalUrl}`);
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        if (!token) {
            logger.warn('Access token is missing.')
            return res
                .status(401)
                .json(new ApiResponse(401, {}, 'Unauthorized request.'))
            // throw new ApiError(401, 'Unauthorized request')
        }
    
        const decodedToken = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        if (!decodedToken) {
            logger.error('Invalid Access Token')
            return res
                .status(401)
                .json(new ApiResponse(401, {}, 'Invalid Access Token'))
            // throw new ApiError(401, 'Invalid Access Token')
        }
    
        const user = await User.findById(decodedToken?._id).select('-password -refreshToken')
        if (!user) {
            logger.error(`Database query failed for user: ${decodedToken._id}`)
            return res
                .status(404)
                .json(new ApiResponse(404, {}, 'User not found.'))
            // throw new ApiError(401, 'User not found')
        }
        logger.info(`Access Token verified for user: ${user.username}`)
        req.user = user
        next()
    } catch (error) {
        logger.error(`${error.name}: ${error.message}`)
        return res
            .status(401)
            .json(new ApiResponse(401, {}, error.message || `Invalid Access Token`))
        // throw new ApiError(401, error?.message || `Invalid Access Token`)   
    }
})

export { verifyJWT }