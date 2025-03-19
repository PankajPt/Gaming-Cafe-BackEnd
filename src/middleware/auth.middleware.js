import jwt from 'jsonwebtoken'
import User from '../models/user.model.js'
import asyncHandler from '../utils/asyncHandler.js'
import ApiResponse from '../utils/apiResponse.js'
import { logger } from '../utils/logger.js'


const verifyJWT = asyncHandler(async (req, res, next) => {
    logger.info(`[JWT Middleware] Checking request: ${req.originalUrl}`);
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        if (!token) {
            logger.warn('Access token is missing.', { forcedLogout: true })
            return res
                .status(401)
                .json(new ApiResponse(401, { forcedLogout: true }, 'Unauthorized request.'))
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        if (!decodedToken) {
            logger.error('Invalid Access Token', { forcedLogout: true })
            return res
                .status(401)
                .json(new ApiResponse(401, { forcedLogout: true }, 'Invalid Access Token'))
        }
    
        const user = await User.findById(decodedToken?._id).select('-password -refreshToken')
        if (!user) {
            logger.error(`Database query failed for user: ${decodedToken._id}`, { forcedLogout: true })
            return res
                .status(404)
                .json(new ApiResponse(404, { forcedLogout: true }, 'User not found.'))
        }
        logger.info(`Access Token verified for user: ${user.username}`)
        req.user = user
        next()
    } catch (error) {
        const errorData = {
            name: error?.name,
            message: error?.message,
            statusCode: error?.statusCode
        }
        logger.error("[JWT Verify]", errorData)
        return res
            .status(401)
            .json(new ApiResponse(401, { forcedLogout: true }, error?.message || `Invalid Access Token`))
    }
})

export { verifyJWT }