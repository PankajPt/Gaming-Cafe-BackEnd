import jwt from 'jsonwebtoken'
import User from '../models/user.model.js'
import asyncHandler from '../utils/asyncHandler.js'
import ApiError from '../utils/apiError.js'
import ApiResponse from '../utils/apiResponse.js'


const verifyJWT = asyncHandler(async (req, res, next) => {
    // console.log(`[JWT Middleware] Checking request: ${req.originalUrl}`);
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        if (!token) {
            return res
                .status(401)
                .json(new ApiResponse(401, {}, 'Unauthorized request.'))
            // throw new ApiError(401, 'Unauthorized request')
        }
    
        const decodedToken = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        if (!decodedToken) {
            return res
                .status(401)
                .json(new ApiResponse(401, {}, 'Invalid Access Token'))
            // throw new ApiError(401, 'Invalid Access Token')
        }
    
        const user = await User.findById(decodedToken?._id).select('-password -refreshToken')
        if (!user) {
            return res
                .status(404)
                .json(new ApiResponse(404, {}, 'User not found.'))
            // throw new ApiError(401, 'User not found')
        }

        req.user = user
        next()
    } catch (error) {

        return res
            .status(401)
            .json(new ApiResponse(401, {}, error.message || `Invalid Access Token`))
        // throw new ApiError(401, error?.message || `Invalid Access Token`)   
    }
})

export { verifyJWT }