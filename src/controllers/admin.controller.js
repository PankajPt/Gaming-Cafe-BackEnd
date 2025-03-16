import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import Event from "../models/event.model.js"
import User from "../models/user.model.js";
import Catalogue from '../models/catalogue.model.js'
import SubscriptionModels from '../models/subscription.model.js'
import Slot from "../models/slot.model.js";
import Booking from "../models/booking.model.js";
import { uploadOnCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js'
import {rolePermissions, permissions} from '../config/constants.js'
import fs from 'fs'
import { isValidObjectId } from "mongoose";
import { logger } from "../utils/logger.js";


const verifyUserPermissions = (permissionData, res) => {
    const { userPermissions, requiredPermission } = permissionData;

    if (!userPermissions.includes(requiredPermission)) {
        res.status(403).json(new ApiError(403, 'Access denied: The user does not have permission to view this page.'));
        return false;
    }
    logger.info(`Access granted: User has the required permission [${requiredPermission}] to view this page.`);
    return true;
};

const removeTempFile = async(file) => {
    logger.info(`Removing file: [${file}] from public/temp directory.`);
    await file && fs.unlinkSync(file)
}

// view users
const viewUsers = asyncHandler(async(req, res)=>{

    const permissionData = {
        requiredPermission: permissions.VIEW_ALL_USERS,
        userPermissions: req.user.permissions
    }
    const isVerified = verifyUserPermissions(permissionData, res)
    if (!isVerified) {
        logger.warn(`Unauthorized access attempt to viewUsers by: [${req.user?.username}]`, permissionData);
        return;
    }
    

    const users = await User.find({ role: {$ne: 'admin'}}).select('-password -permissions -createdAt -updatedAt -__v')
    if (!users){
        logger.warn('No users found.');
        return res
            .status(404)
            .json(new ApiError(404, 'Users not found'))

    }

    logger.info('Retrieved all user details successfully.');
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
        logger.warn(`Unauthorized access attempt to changeUserRole by: [${req.user?.username}]`, permissionData);
        return
    }
    const { userId, newRole } = req.body
    if(!(userId && newRole)){
        logger.warn('Validation failed: Username cannot be blank.');
        return res
            .status(400)
            .json(new ApiError(400, 'userId and role are required.'))
    }

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
        logger.warn(`User not found. ID: [${userId}]`);
        return res
            .status(404)
            .json(new ApiError(404, 'User not found'))
    }

    logger.info(`${user.username} permissions changed to ${newRole}`)
    return res
        .status(200)
        .json(new ApiResponse(200, user, `${user.username} permissions changed to ${newRole}`))
})

// add new games
const addNewGame = asyncHandler(async(req, res)=>{
    const { title, description } = req.body
    const imageFilePath = req.file?.path

    const permissionData = {
        requiredPermission: permissions.ADD_NEW_GAME,
        userPermissions: req.user.permissions
    }
    const isVerified = verifyUserPermissions(permissionData, res)
    if (!isVerified){
        logger.warn(`Unauthorized access attempt to addNewGame by: [${req.user?.username}]`, permissionData);
        return
    }

    if (!title || !description || !imageFilePath){
        logger.warn('Validation failed: Title, description, and image file path are required.');
        await removeTempFile(imageFilePath)
        return res
            .status(400)
            .json(new ApiError(400, 'All fields(title, description, image) are required.'))
    }

    const cloudiResponse = await uploadOnCloudinary(imageFilePath, 'image')
    if(!cloudiResponse){
        return res
        .status(500)
        .json(new ApiError(500, 'Something went wrong, please try again.'))
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
    if(!game){
        await deleteFromCloudinary(cloudiResponse.url, cloudiResponse.public_id, 'image')
        return res
        .status(500)
        .json(new ApiError(500, 'Something went wrong, please try again.'))
    }
    logger.info(`Game added to catalog successfully: [${game.title}].`);
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
        logger.warn(`Unauthorized access attempt to deleteGame by: [${req.user?.username}]`, permissionData);
        return
    }
    if(!gameId){
        logger.warn('Operation failed: Game ID is required.');
        return res
        .status(400)
        .json(new ApiError(400, 'Game id is required to perform this operation'))
    }

    const destroyGame = await Catalogue.findOneAndDelete({_id: gameId}).select('thumbnail')
    if (!destroyGame){
        logger.warn('Game not found in catalog.');
        return res
        .status(404)
        .json(new ApiError(404, 'Game not found in catalogue.'))
    }

    await deleteFromCloudinary("", destroyGame.publicId, 'image')
    const gameCatalogue = await Catalogue.find().select('-owner -createdAt -updatedAt -__v')
    logger.info(`Game deleted successfully: [${gameCatalogue.title}].`);
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
        logger.warn(`Unauthorized access attempt to viewUsers by: [${req.user?.username}]`, permissionData);
        return
    }

    const { title, description, date, prizeMoney, entryFee } = req.body
    const imageFilePath = req.file?.path

    if (!title || !description || !imageFilePath || !prizeMoney || !entryFee || !date){
        await removeTempFile(imageFilePath)
        return res
            .status(400)
            .json(new ApiResponse(400, {}, 'All fields (title, description, image, date, prizeMoney, entryFee) are required'))
    }

    if (prizeMoney <=0 || entryFee <=0){
        await removeTempFile(imageFilePath)
        return res
            .status(400)
            .json(new ApiResponse(400, {}, 'Prize Money and Entry Fee cannot be less than 0.'))
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
        logger.warn(`Unauthorized access attempt to viewUsers by: [${req.user?.username}]`, permissionData);
        return
    }

    const { eventId } = req.params

    if(!eventId){
        return res
        .status(400)
        .json(new ApiError(400, 'Event id required to perform this operation.'))
    }
    const destroy = await Event.findOneAndDelete({_id: eventId}).select('thumbnail')
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
// Create slots - Date Range[(yyyy-mm-dd),(yyyy-mm-dd)], Time Range[all time slots]
const createSlot = asyncHandler(async(req, res) => {
    const permissionData = {
        requiredPermission: permissions.ADD_SLOT,
        userPermissions: req.user.permissions
    }

    const isVerified = verifyUserPermissions(permissionData, res)
    if (!isVerified){
        logger.warn(`Unauthorized access attempt to viewUsers by: [${req.user?.username}]`, permissionData);
        return
    }

    const { dateRange, timeRange } = req.body
    if (!dateRange?.length || !timeRange?.length ){
        return res
            .status(400)
            .json(new ApiError(400, 'All fields(dateRange[], timeRange[]) are required.'))
    }
    const slotsToCreate = []
    
    for (let date of dateRange){
        for (let timeFrame of timeRange){
            slotsToCreate.push(
                {
                    date,
                    timeFrame
                }
            )
        }
    }
    const createdSlots = await Slot.insertMany(slotsToCreate)
    if(!createSlot){
        return res
            .status(500)
            .json(new ApiError(500, 'Something went wrong while uploading data, please try again.'))
    }
    return res
        .json(new ApiResponse(201, createdSlots, 'Slots created successfully.'))
        .status(201)
})

const getAllBookedSlots = asyncHandler(async(req, res)=>{
    const permissionData = {
        requiredPermission: permissions.VIEW_BOOKINGS,
        userPermissions: req.user.permissions
    }
    const isVerified = verifyUserPermissions(permissionData, res)
    if (!isVerified){
        logger.warn(`Unauthorized access attempt to viewUsers by: [${req.user?.username}]`, permissionData);
        return
    }

    const bookings = await Booking.aggregate([
        {
            $lookup: {
                from: 'slots',
                localField: 'slotId',
                foreignField: '_id',
                as: 'slotDetails'
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                as: 'userDetails'
            }
        },
        {
            $unwind: {
                path: '$slotDetails',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $unwind: {
                path: '$userDetails',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                _id: 1,
                slotId: 1,
                userId: 1,
                date: '$slotDetails.date',
                timeFrame: '$slotDetails.timeFrame',
                username: '$userDetails.username',
                fullname: '$userDetails.fullname',
                email: '$userDetails.email'
            }
        }
    ])

    if(!bookings.length || !bookings){
        return res
            .status(404)
            .json(new ApiError(404, 'No bookings found.'))
    }

    return res
        .status(200)
        .json(new ApiResponse(200, bookings, 'Bookings fetched.'))

})

const clearBooking = asyncHandler(async(req, res)=> {
    const permissionData = {
        requiredPermission: permissions.CLEAR_BOOKING, 
        userPermissions: req.user.permissions
    }
    const isVerified = verifyUserPermissions(permissionData, res)
    if (!isVerified){
        logger.warn(`Unauthorized access attempt to viewUsers by: [${req.user?.username}]`, permissionData);
        return
    }
    const { bookingId } = req.params
    if(!bookingId){
        return res
            .status(400)
            .json(new ApiError(400, 'Booking Id required.'))
    }

    if(!isValidObjectId(bookingId)){
        return res
            .status(400)
            .json(new ApiError(400, 'Invalid booking id.'))
    }

    const destroy = await Booking.deleteOne({_id: bookingId})
    if(!destroy?.deletedCount){
        return res
            .status(404)
            .json(new ApiError(404, 'Booking not found.'))
    }
    return res
        .status(200)
        .json(new ApiResponse(200, {}, `Booking cancelled.`))
})

// Delete Slots - Slot id
const deleteSlotById = asyncHandler(async(req, res) => {
    const permissionData = {
        requiredPermission: permissions.DELETE_SLOT,
        userPermissions: req.user.permissions
    }

    const isVerified = verifyUserPermissions(permissionData, res)
    if (!isVerified){
        logger.warn(`Unauthorized access attempt to viewUsers by: [${req.user?.username}]`, permissionData);
        return
    }

    const { slotId } = req.params
    if(!slotId){
        return res
            .status(400)
            .json(new ApiError(400, 'Slot id is required.'))
    }
    const destroy = await Slot.findOneAndDelete({_id: slotId})
    if(!destroy){
        return res
            .status(404)
            .json(new ApiError(404, 'Slot not found. Refresh the page.'))
    }

    return res
        .status(200)
        .json(new ApiResponse(200, destroy, `${destroy.timeFrame} is deleted successfully.`))

})

const deleteSlotsByDate = asyncHandler(async(req, res)=>{
    const permissionData = {
        requiredPermission: permissions.DELETE_SLOT,
        userPermissions: req.user.permissions
    }

    const isVerified = verifyUserPermissions(permissionData, res)
    if (!isVerified){
        logger.warn(`Unauthorized access attempt to viewUsers by: [${req.user?.username}]`, permissionData);
        return
    }

    const { date } = req.query

    if(!date){
        return res
            .status(400)
            .json(new ApiError(400, 'Date is required(yyyy-mm-dd).'))
    }
    const destroy = await Slot.deleteMany({date})
    if(!destroy){
        return res
            .status(404)
            .json(new ApiError(404, 'Slot not found. Refresh the page.'))
    }

    return res
        .status(200)
        .json(new ApiResponse(200, destroy, `Slots deleted for ${date}`))        
})

// create plans
const createSubscriptionPlan = asyncHandler(async(req, res)=>{

    const permissionData = {
        requiredPermission: permissions.CREATE_SUBSCRIPTION_PLAN,
        userPermissions: req.user.permissions
    }

    const isVerified = verifyUserPermissions(permissionData, res)
    if (!isVerified){
        logger.warn(`Unauthorized access attempt to viewUsers by: [${req.user?.username}]`, permissionData);
        return
    }

    const { title, description, features, price } = req.body


    const paymentQRPath  = req.file?.path

    if(!(features && description && title && price && paymentQRPath)){
        await removeTempFile(paymentQRPath)
        return res
            .status(400)
            .json(new ApiError(400, 'All fields (name, description, period, price) are required.'))
    }

    if(price <= 0){
        await removeTempFile(paymentQRPath)
        return res
            .status(400)
            .json(new ApiError(400, 'Price cannot be less than 0.'))
    }

    const featureArr = features
                            ?.split(",")
                            .map((item) => item.trim())
                            .filter((item) => item !== "")

    const cloudiResponse = await uploadOnCloudinary(paymentQRPath, 'image')
    if(!cloudiResponse){
        return res
            .status(500)
            .json(new ApiError(500, 'Something went wrong, please try again.'))
    }

    const newPlan = await SubscriptionModels.create(
        {
            title,
            description,
            features: featureArr,
            price,
            paymentQR: {
                url: cloudiResponse?.secure_url,
                publicId: cloudiResponse?.public_id
            }
        }
    )

    if(!newPlan){
        deleteFromCloudinary(cloudiResponse.url, cloudiResponse.public_id, 'image')
        return res
            .status(500)
            .json(new ApiError(500, 'Something went wrong, please try again.'))
    }

    const plainSubscription = newPlan.toObject()
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
        logger.warn(`Unauthorized access attempt to viewUsers by: [${req.user?.username}]`, permissionData);
        return
    }

    const { planId } = req.params
    
    if(!planId){
        return res
            .status(400)
            .json(new ApiError(400, 'Id required to delete subscription plan.'))
    }

    const destroy = await SubscriptionModels.findOneAndDelete({_id: planId})

    if(!destroy){
        return res
            .status(404)
            .json(new ApiError(404, 'Plan not found. Please refresh session.'))
    }

    const deleteImage = await deleteFromCloudinary(destroy.paymentQR.url, destroy.paymentQR.publicId, 'image')
    if(!deleteImage){
        // log the public id and url 
    }

    return res
        .status(200)
        .json(new ApiResponse(200, destroy, `${destroy.title} has deleted successfully.`))

})

export { changeUserRole, addNewGame, deleteGame, 
    createEvent, deleteEvent, createSubscriptionPlan, 
    viewUsers, deleteSubscriptionPlan, createSlot, 
    deleteSlotById, deleteSlotsByDate, getAllBookedSlots,
    clearBooking }