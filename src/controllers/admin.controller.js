import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import Event from "../models/event.model.js"
import User from "../models/user.model.js";
import Catalogue from '../models/catalogue.model.js'
import { uploadOnCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js'
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
const addNewGame = asyncHandler(async(req, res)=>{
    const { title, description } = req.body
    const imageFilePath = req.file?.path

    if (!(title && description && imageFilePath)){
        throw new ApiError(400, 'All fields(title, description, image) are required.')
    }

    const cloudiResponse = await uploadOnCloudinary(imageFilePath, 'image')

    if(!cloudiResponse){
        throw new ApiError(500, "Something went wrong while uploading game image on cloudinary.")
    }

    const game = await Catalogue.create(
        {
            title,
            description,
            thumbnail: {
                url: cloudiResponse?.url,
                publicId: cloudiResponse?.public_id
            }
        }
    )

    if(!game){
        throw new ApiError(500, 'Something went wrong while creating new entry in DB.')
    }

    return res
        .status(200)
        .json(new ApiResponse(200, game, `Game ${game.title} added in catalogue successfully.`))
})

// delete games
// need to change user model user controller and delete from cloudinary
const deleteGame = asyncHandler(async(req, res)=>{
    const gameId = req.body
    if(!gameId){
        throw new ApiError(400, 'Game id is required to perform this operation')
    }

    const destroyGame = await Catalogue.findOneAndDelete({_id: gameId}).select('thumbnail')
    console.log(destroyGame)
    if (!destroyGame){
        throw new ApiError(404, 'No documents matched the filter')
    }

    await deleteFromCloudinary("", destroyGame.publicId, 'image')

    return res
        .status(200)
        .json(new ApiResponse(200, {}, 'Game deleted successfully'))

})

// create new events
const createEvent = asyncHandler(async(req, res)=>{
    const { title, description, date, prizeMoney, entryFee } = req.body
    const imageFilePath = req.file?.path

    if (!(title && description && imageFilePath && prizeMoney && entryFee)){
        await removeTempFile(imageFilePath)
        throw new ApiError(400, 'All fields (title, description, image, prizeMoney, entryFee) are required')
    }

    const cloudiResponse = await uploadOnCloudinary(imageFilePath, 'image')
    const newEvent = await Event.create(
        {
            title,
            description,
            thumbnail:{
                url: cloudiResponse?.url,
                publicId: cloudiResponse?.public_id
            },
            createdAt: date,
            prizeMoney,
            entryFee
        }
    )

    if(!newEvent){
        throw new ApiError(500, 'Enable to create event at the moment. something went wrong while updating DB.')
    }

    return res
        .status(200)
        .json(new ApiResponse(200, newEvent, 'Event created successfully.'))
    
})


// delete event
const deleteEvent = asyncHandler(async(req, res)=>{
    const eventId = req.body
    if(!eventId){
        throw new ApiError(400, 'Event id required to perform this operation.')
    }
    const destroy = await Event.findOneAndDelete({_id: eventId}).select('thumbnail')
    if(!destroy){
        throw new ApiError(404, 'Event not found.')
    }
    
    await deleteFromCloudinary(destroy.url, destroy.publicId, 'image')
    return res
        .status(200)
        .json(200, {}, 'Event deleted successfully.')

})
// arrange slots


// create plans

export { createManager, addNewGame, deleteGame, createEvent,
    deleteEvent, }