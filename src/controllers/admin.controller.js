import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import Event from "../models/event.model.js"
import User from "../models/user.model.js";
import {rolePermissions} from '../config/constants.js'

// view users
const viewUsers = asyncHandler(async(req, res)=>{
    const users = await User.find()
    if (!users){
        throw new ApiError(404, 'No registered users found');
    }

    return res
        .status(200)
        .json(new ApiResponse(200, users, 'Users fetch successfully'))
})

// create new manager
const createManager = asyncHandler(async(req, res)=> {
    const { username } = req.body
    if(!username){
        throw new ApiError(400, 'Username cannot be blank');
    }
    const modifiedUsername = username.toLowerCase().trim()
    const user = await User.findOneAndUpdate(
        {
            username: modifiedUsername
        },
        {
            $set: {
                role: 'manager', 
                permissions: rolePermissions.manager
            }
        },
        {
            new: true
        }
    ).select('-password -refreshToken')

    // set permissions to manager

    if(!user){
        throw new ApiError(404, 'User not found')
    }

    return res
        .status(200)
        .json(new ApiResponse(200, user, `${user.username} permissions changed to manager`))
})

// add new games


// delete games


// create new events


// delete event


// arrange slots


// create plans

export { viewUsers, createManager }