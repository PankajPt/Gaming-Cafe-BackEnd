import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import Event from "../models/event.model.js"
import User from "../models/user.model.js";
import Catalogue from '../models/catalogue.model.js'
import SubscriptionModels from '../models/subscription.model.js'
import Slot from "../models/slot.model.js";
import Booking from "../models/booking.model.js";
import UserPlan from "../models/userPlan.model.js";
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
            new: true,
            runValidators: true
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
        logger.warn(`Unauthorized access attempt to createEvent by: [${req.user?.username}]`, permissionData);
        return
    }

    const { title, description, date, prizeMoney, entryFee } = req.body
    const imageFilePath = req.file?.path

    if (!title || !description || !imageFilePath || !prizeMoney || !entryFee || !date){
        await removeTempFile(imageFilePath)
        logger.warn('Validation failed: All fields (title, description, image, date, prizeMoney, entryFee) are required.');
        return res
            .status(400)
            .json(new ApiError(400, 'All fields (title, description, image, date, prizeMoney, entryFee) are required'))
    }

    if (prizeMoney <= 0 || entryFee <= 0){
        await removeTempFile(imageFilePath)
        logger.warn('Validation failed: Prize Money and Entry Fee cannot be less than 0.');
        return res
            .status(400)
            .json(new ApiError(400, 'Prize Money and Entry Fee cannot be less than 0.'))
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
        logger.error('Event creation failed: An error occurred while updating the database.');
        return res
            .status(500)
            .json(new ApiError(500, 'Something went wrong, please try again.'))
    }

    logger.info('Event created successfully.');
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
        logger.warn(`Unauthorized access attempt to deleteEvent by: [${req.user?.username}]`, permissionData);
        return
    }

    const { eventId } = req.params

    if(!eventId){
        logger.warn('Operation failed: Event ID is required.');
        return res
            .status(400)
            .json(new ApiError(400, 'Event id required to perform this operation.'))
    }
    const destroy = await Event.findOneAndDelete({_id: eventId}).select('thumbnail')
    if(!destroy){
        logger.warn('Event not found.');
        return res
            .status(404)
            .json(new ApiError(404, 'Event not found.'))
    }

    await deleteFromCloudinary(destroy.thumbnail.url, destroy.thumbnail.publicId, 'image')
    logger.info('Event deleted successfully.');
    return res
        .status(200)
        .json(new ApiResponse(200, {}, 'Event deleted successfully.'))

})

// arrange slots
const createSlot = asyncHandler(async(req, res) => {
    const permissionData = {
        requiredPermission: permissions.ADD_SLOT,
        userPermissions: req.user.permissions
    }

    const isVerified = verifyUserPermissions(permissionData, res)
    if (!isVerified){
        logger.warn(`Unauthorized access attempt to createSlot by: [${req.user?.username}]`, permissionData);
        return
    }

    const { dateRange, timeRange } = req.body
    if (!dateRange?.length || !timeRange?.length ){
        logger.warn('Validation failed: All fields (dateRange[], timeRange[]) are required.');
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
    if(!createdSlots){
        logger.error('Slot creation failed: An error occurred while inserting slots into the database.');
        return res
            .status(500)
            .json(new ApiError(500, 'Something went wrong while uploading data, please try again.'))
    }
    logger.info('Slots created successfully.');
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
        logger.warn(`Unauthorized access attempt to getAllBookedSlots by: [${req.user?.username}]`, permissionData);
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
        logger.warn('No bookings found.');
        return res
            .status(404)
            .json(new ApiError(404, 'No bookings found.'))
    }
    logger.info('Bookings fetched successfully.');
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
        logger.warn(`Unauthorized access attempt to clearBooking by: [${req.user?.username}]`, permissionData);
        return
    }
    const { bookingId } = req.params
    if(!bookingId){
        logger.warn('Validation failed: Booking ID is required.');
        return res
            .status(400)
            .json(new ApiError(400, 'Booking Id required.'))
    }

    if(!isValidObjectId(bookingId)){
        logger.warn('Validation failed: Invalid booking ID.');
        return res
            .status(400)
            .json(new ApiError(400, 'Invalid booking id.'))
    }

    const destroy = await Booking.deleteOne({_id: bookingId})
    if(!destroy?.deletedCount){
        logger.warn('Booking not found.');
        return res
            .status(404)
            .json(new ApiError(404, 'Booking not found.'))
    }
    logger.info('Booking cancelled successfully.');
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
        logger.warn(`Unauthorized access attempt to deleteSlotById by: [${req.user?.username}]`, permissionData);
        return
    }

    const { slotId } = req.params
    if(!slotId){
        logger.warn('Validation failed: Slot ID is required.');
        return res
            .status(400)
            .json(new ApiError(400, 'Slot id is required.'))
    }

    if(!isValidObjectId(slotId)){
        logger.warn('Validation failed: Invalid Slot ID.');
        return res
            .status(400)
            .json(new ApiError(400, 'Invalid Slot id.'))
    }

    const destroy = await Slot.findOneAndDelete({_id: slotId})
    if(!destroy){
        logger.warn('Slot not found. User advised to refresh the page.');
        return res
            .status(404)
            .json(new ApiError(404, 'Slot not found. Refresh the page.'))
    }
    logger.info(`Time frame [${destroy.timeFrame}] deleted successfully.`);
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
        logger.warn(`Unauthorized access attempt to deleteSlotsByDate by: [${req.user?.username}]`, permissionData);
        return
    }

    const { date } = req.query

    if(!date){
        logger.warn('Validation failed: Date is required (format: yyyy-mm-dd).');
        return res
            .status(400)
            .json(new ApiError(400, 'Date is required(yyyy-mm-dd).'))
    }
    const destroy = await Slot.deleteMany({date})
    if(!destroy){
        logger.warn('Slot not found. User advised to refresh the page.');
        return res
            .status(404)
            .json(new ApiError(404, 'Slot not found. Refresh the page.'))
    }

    logger.info(`Time frame [${date}] deleted successfully.`);
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
        logger.warn(`Unauthorized access attempt to createSubscriptionPlan by: [${req.user?.username}]`, permissionData);
        return
    }

    const { title, description, features, price } = req.body
    const paymentQRPath  = req.file?.path

    if(!features || !description || !title || !price || !paymentQRPath){
        await removeTempFile(paymentQRPath)
        logger.warn('Validation failed: All fields (name, description, period, price) are required.');
        return res
            .status(400)
            .json(new ApiError(400, 'All fields (name, description, period, price) are required.'))
    }

    if(price <= 0){
        await removeTempFile(paymentQRPath)
        logger.warn('Validation failed: Price cannot be less than 0.');
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
        logger.error('Subscription plan creation failed: An error occurred while saving to the database.');
        deleteFromCloudinary(cloudiResponse.url, cloudiResponse.public_id, 'image')
        return res
            .status(500)
            .json(new ApiError(500, 'Something went wrong, please try again.'))
    }

    const plainSubscription = newPlan.toObject()
    delete plainSubscription.createdAt
    delete plainSubscription.updatedAt
    delete plainSubscription.__v

    logger.info('New subscription plan created successfully.');
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
        logger.warn(`Unauthorized access attempt to deleteSubscriptionPlan by: [${req.user?.username}]`, permissionData);
        return
    }

    const { planId } = req.params
    if(!planId){
        logger.warn('Validation failed: ID is required to delete the subscription plan.');
        return res
            .status(400)
            .json(new ApiError(400, 'Id required to delete subscription plan.'))
    }

    if(!isValidObjectId(planId)){
        logger.warn('Validation failed: Invalid Plan ID.');
        return res
            .status(400)
            .json(new ApiError(400, 'Invalid Plan id.'))
    }

    const destroy = await SubscriptionModels.findOneAndDelete({_id: planId})

    if(!destroy){
        logger.warn('Plan not found. User advised to refresh the session.');
        return res
            .status(404)
            .json(new ApiError(404, 'Plan not found. Please refresh session.'))
    }

    deleteFromCloudinary(destroy.paymentQR.url, destroy.paymentQR.publicId, 'image')

    logger.info(`Subscription plan deleted successfully: [${destroy.title}].`);
    return res
        .status(200)
        .json(new ApiResponse(200, destroy, `${destroy.title} has deleted successfully.`))

})

const assignPlanToUser = asyncHandler(async(req, res)=>{
    const permissionData = {
        requiredPermission: permissions.ASSIGN_PLAN,
        userPermissions: req.user.permissions
    }
    const isVerified = verifyUserPermissions(permissionData, res)
    if (!isVerified){
        logger.warn(`Unauthorized access attempt to assignPlanToUser by: [${req.user?.username}]`, permissionData);
        return
    }
    const { userId, plan } = req.body
    if(!userId || !['monthly', 'quarterly', 'yearly'].includes(plan?.trim().toLowerCase())){
        logger.warn("Validation failed: UserId and Plan are required. Allowed plan values: monthly, quarterly, yearly.");
        return res
            .status(400)
            .json(new ApiError(400, "Validation failed: UserId and Plan are required. Allowed plan values: monthly, quarterly, yearly."))
    }

    if (!isValidObjectId(userId)){
        logger.warn('Validation failed: Invalid user ID.');
        return res
            .status(400)
            .json(new ApiError(400, 'Invalid user id.'))
    }

    const existingPlan = await UserPlan.find({owner: userId}, {expiresAt: 1}).sort({_id: -1})
    if ( !existingPlan ){
        logger.info("No existing plan found for the user.");
        const assignNewPlan = await UserPlan.create(
            {
                owner: userId,
                plan,
                startDate: new Date(Date.now()),
            }
        )
        
        if (!assignNewPlan){
            logger.error("Failed to assign new plan to the user.");
            return res
                .status(500)
                .json(new ApiError(500, 'Failed to assign new plan to the user.'))
        }

        logger.info(`Plan [${plan}] assigned to user: ${userId}`);
        return res
            .status(201)
            .json(new ApiResponse(201, assignNewPlan, `Plan [${plan}] assigned to user: ${userId}`))
    } else {
        logger.info("Existing plan found for the user.");
        const assignNewPlan = await UserPlan.create(
            {
                owner: userId,
                plan,
                startDate: existingPlan[0]?.expiresAt,
            }
        )
        
        if (!assignNewPlan){
            logger.error("Failed to assign new plan to the user.");
            return res
                .status(500)
                .json(new ApiError(500, 'Failed to assign new plan to the user.'))
        }

        logger.info(`Plan [${plan}] assigned to user: ${userId}`);
        return res
            .status(201)
            .json(new ApiResponse(201, assignNewPlan, `Plan [${plan}] assigned to user: ${userId}`))
    }
})

export { changeUserRole, addNewGame, deleteGame, 
    createEvent, deleteEvent, createSubscriptionPlan, 
    viewUsers, deleteSubscriptionPlan, createSlot, 
    deleteSlotById, deleteSlotsByDate, getAllBookedSlots,
    clearBooking, assignPlanToUser }