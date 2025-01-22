import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import Event from "../models/event.model.js"
import User from "../models/user.model.js";
import {rolePermissions, permissions} from '../config/constants.js'


// create new manager
// drop down menu to select only manager or user
// need to handle at frontend admin role change option disabled.
// if user then option to change role to manager and vice versa
const createManager = asyncHandler(async(req, res)=> {
    const requiredPermission = permissions.CHANGE_USER_PERMISSION
    const userPermissions = req.user.permissions

    if (!userPermissions.some((permission) => permission === requiredPermission)){
        throw new ApiError(403, 'Access denied: The user does not have permission to view this page.')
    }

    const { username, newRole } = req.body
    if(!(username && newRole)){
        throw new ApiError(400, 'Username cannot be blank');
    }
    const modifiedUsername = username.toLowerCase().trim()
    const user = await User.findOneAndUpdate(
        {
            username: modifiedUsername
        },
        {
            $set: {
                role: newRole, 
                permissions: rolePermissions[newRole]
            }
        },
        {
            new: true
        }
    ).select('-password -refreshToken')

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

export { createManager }