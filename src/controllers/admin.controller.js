import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import Event from "../models/event.model.js"
import User from "../models/user.model.js";
import Catalogue from '../models/catalogue.model.js'
import SubscriptionModels from '../models/subscription.model.js'
import { uploadOnCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js'
import {rolePermissions, permissions} from '../config/constants.js'
import fs from 'fs'

// create new manager
// drop down menu to select only manager or user
// need to handle at frontend admin role change option disabled.
// if user then option to change role to manager and vice versa
// TODO: need handling for duplicate check 
// MongoServerError: E11000 duplicate key error collection: MADGEAR.catalogues index: title_1 dup key: { title: "Black Myth" }


const verifyUserPermissions = (permissionData, res) => {
    const { userPermissions, requiredPermission } = permissionData;

    if (!userPermissions.includes(requiredPermission)) {
        res.status(403).json(new ApiError(403, 'Access denied: The user does not have permission to view this page.'));
        return false;
    }
    return true;
};


const removeTempFile = async(file) => {
    await file && fs.unlinkSync(file)
}

// view users
const viewUsers = asyncHandler(async(req, res)=>{

    const permissionData = {
        requiredPermission: permissions.VIEW_ALL_USERS,
        userPermissions: req.user.permissions
    }
    const isVerified = verifyUserPermissions(permissionData, res)
    if (!isVerified){
        return
    }

    const users = await User.find({ role: {$ne: 'admin'}}).select('-password -permissions -createdAt -updatedAt -__v')
    if (!users){
        return res
            .status(404)
            .json(new ApiResponse(404, {}, 'User not found'))
        // throw new ApiError(404, 'No registered users found');
    }

    return res
        .status(200)
        .json(new ApiResponse(200, users, 'Users fetch successfully'))
})

const changeUserRole = asyncHandler(async(req, res)=> {
    const permissionData = {
        requiredPermission: permissions.CHANGE_USER_PERMISSION,
        userPermissions: req.user.permissions
    }
    const isVerified = verifyUserPermissions(permissionData, res)
    if (!isVerified){
        return
    }
    const { userId, newRole } = req.body
    if(!(userId && newRole)){
        // throw new ApiError(400, 'Username cannot be blank');
        return res
            .status(400)
            .json(new ApiResponse(400, {}, 'userId and role are required.'))
    }
    // const modifiedUsername = username.toLowerCase().trim()
    const user = await User.findByIdAndUpdate( userId,
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
        // throw new ApiError(404, 'User not found')
        return res
            .status(404)
            .json(new ApiResponse(404, {}, 'User not found'))
    }

    return res
        .status(200)
        .json(new ApiResponse(200, user, `${user.username} permissions changed to ${newRole}`))
})

// add new games
const addNewGame = asyncHandler(async(req, res)=>{
    const { title, description } = req.body
    
    console.log(req.file)
    // const fileName = req.file?.filename
    // const imageFilePath = path.join(process.cwd(), 'public', 'temp', fileName)
    // const imageFilePath = path.resolve(req.file.path)
    const imageFilePath = req.file?.path
    console.log(`Image file path is: ${imageFilePath}`)

    const permissionData = {
        requiredPermission: permissions.ADD_NEW_GAME,
        userPermissions: req.user.permissions
    }
    const isVerified = verifyUserPermissions(permissionData, res)
    if (!isVerified){
        return
    }

    if (!(title && description && imageFilePath)){
        await removeTempFile(imageFilePath)
        return res
            .status(400)
            .json(new ApiResponse(400, {}, 'All fields(title, description, image) are required.'))
    }

    const cloudiResponse = await uploadOnCloudinary(imageFilePath, 'image')
    console.log(cloudiResponse)
    if(!cloudiResponse){
        return res
        .status(500)
        .json(new ApiResponse(500, {}, 'Something went wrong, please try again.'))
    }

    const game = await Catalogue.create(
        {
            title,
            description,
            thumbnail: {
                url: cloudiResponse?.url,
                publicId: cloudiResponse?.public_id
            },
            owner: req.user._id
        }
    )
    // console.log('game')
    if(!game){
        await deleteFromCloudinary(cloudiResponse.url, cloudiResponse.public_id, 'image')
        // throw new ApiError(500, 'Something went wrong while creating new entry in DB.')
        return res
        .status(500)
        .json(new ApiResponse(500, {}, 'Something went wrong, please try again.'))
        
    }

    return res
        .status(200)
        .json(new ApiResponse(200, game, `Game ${game.title} added in catalogue successfully.`))
})

// delete games
const deleteGame = asyncHandler(async(req, res)=>{
    const { gameId } = req.body
    const permissionData = {
        requiredPermission: permissions.DELETE_GAME,
        userPermissions: req.user.permissions
    }
    const isVerified = verifyUserPermissions(permissionData, res)
    if (!isVerified){
        return
    }
    if(!gameId){
        // throw new ApiError(400, 'Game id is required to perform this operation')
        return res
        .status(400)
        .json(new ApiResponse(400, {}, 'Game id is required to perform this operation'))
    }

    const destroyGame = await Catalogue.findOneAndDelete({_id: gameId}).select('thumbnail')
    console.log(destroyGame)
    if (!destroyGame){
        // throw new ApiError(404, 'No documents matched the filter')
        return res
        .status(404)
        .json(new ApiResponse(404, {}, 'Game not found in catalogue.'))
    }

    await deleteFromCloudinary("", destroyGame.publicId, 'image')
    const gameCatalogue = await Catalogue.find().select('-owner -createdAt -updatedAt -__v')

    return res
        .status(200)
        .json(new ApiResponse(200, gameCatalogue, 'Game deleted successfully'))

})

// create new events
const createEvent = asyncHandler(async(req, res)=>{

    const permissionData = {
        requiredPermission: permissions.CREATE_EVENT,
        userPermissions: req.user.permissions
    }
    const isVerified = verifyUserPermissions(permissionData, res)
    if (!isVerified){
        return
    }

    const { title, description, date, prizeMoney, entryFee } = req.body
    const imageFilePath = req.file?.path

    if (!(title && description && imageFilePath && prizeMoney && entryFee)){
        await removeTempFile(imageFilePath)
        // throw new ApiError(400, 'All fields (title, description, image, prizeMoney, entryFee) are required')
        return res
            .status(400)
            .json(new ApiResponse(400, {}, 'All fields (title, description, image, prizeMoney, entryFee) are required'))
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
            eventDate: date,
            prizeMoney,
            entryFee
        }
    )

    if(!newEvent){
        await deleteFromCloudinary(cloudiResponse.url, cloudiResponse.public_id, 'image')
        // throw new ApiError(500, 'Enable to create event at the moment. something went wrong while updating DB.')
        return res
            .status(500)
            .json(new ApiResponse(500, {}, 'Something went wrong, please try again.'))
    }

    return res
        .status(200)
        .json(new ApiResponse(200, newEvent, 'Event created successfully.'))
    
})


// delete event
const deleteEvent = asyncHandler(async(req, res)=>{
    const permissionData = {
        requiredPermission: permissions.DELETE_EVENT,
        userPermissions: req.user.permissions
    }
    const isVerified = verifyUserPermissions(permissionData, res)
    if (!isVerified){
        return
    }

    const { planId } = req.params

    if(!planId){
        return res
        .status(400)
        .json(new ApiError(400, 'Event id required to perform this operation.'))
    }
    const destroy = await Event.findOneAndDelete({_id: planId}).select('thumbnail')
    if(!destroy){
        return res
        .status(404)
        .json(new ApiError(404, 'Event not found.'))
    }

    await deleteFromCloudinary(destroy.thumbnail.url, destroy.thumbnail.publicId, 'image')
    // if false receive as response log the event 
    return res
        .status(200)
        .json(new ApiResponse(200, {}, 'Event deleted successfully.'))

})
// arrange slots


// create plans
const createSubscriptionPlan = asyncHandler(async(req, res)=>{
    const permissionData = {
        requiredPermission: permissions.CREATE_SUBSCRIPTION_PLAN,
        userPermissions: req.user.permissions
    }
    const isVerified = verifyUserPermissions(permissionData, res)
    if (!isVerified){
        return
    }

    const { title, description, features, price } = req.body
    const paymentQRPath  = req.file?.path

    if(!(features && description && title && price && paymentQRPath)){
        return res
            .status(400)
            .json(new ApiError(400, 'All fields (name, description, period, price) are required.'))
    }

    const cloudiResponse = await uploadOnCloudinary(paymentQRPath, 'image')
    if(!cloudiResponse){
        return res
            .status(500)
            .json(new ApiError(500, 'Something went wrong, please try again.'))
    }

    const subscriptionData = await SubscriptionModels.create(
        {
            title,
            description,
            features,
            price,
            paymentQR: {
                url: cloudiResponse?.secure_url,
                publicId: cloudiResponse?.public_id
            }
        }
    )

    if(!subscriptionData){
        deleteFromCloudinary(cloudiResponse.url, cloudiResponse.public_id, 'image')
        return res
            .status(500)
            .json(new ApiError(500, 'Something went wrong, please try again.'))
    }

    const plainSubscription = subscriptionData.toObject()
    delete plainSubscription.createdAt
    delete plainSubscription.updatedAt
    delete plainSubscription.__v

    return res
        .status(201)
        .json(new ApiResponse(200, plainSubscription, 'New subscription plan created.'))
})

const deleteSubscriptionPlan = asyncHandler(async(req, res)=> {
        const permissionData = {
        requiredPermission: permissions.DELETE_SUBSCRIPTION_PLAN,
        userPermissions: req.user.permissions
    }
    const isVerified = verifyUserPermissions(permissionData, res)
    if (!isVerified){
        return
    }
})

export { changeUserRole, addNewGame, deleteGame, createEvent,
    deleteEvent, createSubscriptionPlan, viewUsers, deleteSubscriptionPlan }