import fs from 'fs'
import asyncHandler from '../utils/asyncHandler.js'
import ApiError from '../utils/apiError.js'
import ApiResponse from '../utils/apiResponse.js'
import ApiEmail from '../utils/apiEmail.js'
import { uploadOnCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js'
import { isValidObjectId } from 'mongoose'
import User from '../models/user.model.js'
import Event from '../models/event.model.js'
import Catalogue from '../models/catalogue.model.js'
import SubscriptionModels from '../models/subscription.model.js'
import Slot from '../models/slot.model.js'
import Booking from '../models/booking.model.js'
import jwt from 'jsonwebtoken'
import { sendVerificationLink, verifyEmailToken } from '../utils/emailServices.js'
import { generateVerificationResponse, tokenExpiredResponse, submitPasswordForm } from '../templates/index.template.js'
import { rolePermissions } from '../config/constants.js'
import { logger } from '../utils/logger.js'

// Local
// const  options = {
//     httpOnly: true,
//     secure: false, //true for production setup
//     sameSite: 'lax', //none for prod setup
//     domain: 'localhost',
//     maxAge: 24 * 60 * 60 * 1000
//   }

//   Prod
const  options = {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 24 * 60 * 60 * 1000
  }


// TODO
// incase of empty cookies sent FRL

const removeTempFile = async(file) => {
    await file && fs.unlinkSync(file)
}

const generateAccessAndRefreshToken = async(userID) => {

    try {

        const user = await User.findById({_id: userID})
        if (!user){
            logger.warn(`User details not found for id: ${userID}`)
            throw new ApiError(400, 'User not found')
        }
        
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()
        
        if (!accessToken || !refreshToken){
            logger.error(`MongoDB Error: Error while generating access and refresh token for user ${user._id}`)
            throw new ApiError(500, 'Something went wrong while generating access and refresh token')
        }
        
        user.refreshToken = refreshToken
        await user.save() //validate before save
        logger.info(`Access and Refresh Token generated for user: ${user.username}`)
        return {accessToken, refreshToken}
    } catch (error) {
        logger.error(error)
        throw new ApiError(500, 'Something went wrong while generationg access and refresh token')
    }
}

const generateRandomKey = (userId)=>{
    const randomKey = jwt.sign({_id: userId}, process.env.RANDOM_KEY_SECRET, {expiresIn: process.env.RAMDOM_KEY_EXPIRY})
    if(!randomKey){
        logger.error(`Something went wrong while generating random key.`)
    }
    logger.info(`Random key generated for user: ${userId}`)
    return randomKey
}
// function to create send mail
const sendMailToVerify = async(user) => {
    if (!user){
        logger.warn('User not specified')
        throw new ApiError(400, 'User not specified')
    }
    const sendMail = await sendVerificationLink(new ApiEmail(
        user.email,
        user.fullname,
        `Verify Account`,
        `Click on the button below to verify your account:`,
        `/users/verify-email`,
        generateRandomKey(user._id)
    ))
    return sendMail
}
// api to send verification mail
const sendVerificationEmail = asyncHandler(async(req, res)=>{
    const user = req.user
    const mailStatus = await sendMailToVerify(user)
    if(!mailStatus.success){
        logger.error(`Email verification failed: ${mailStatus.message || 'Something went wrong while sending verification mail. Please try again.'}`);
        return res
            .status(mailStatus.statusCode || 500)
            .json(new ApiError(mailStatus.statusCode || 500, mailStatus.message || 'Something went wrong while sending verification mail, Please try again'))
    }

    logger.info('Verification email sent successfully to the registered email ID.');
    return res
        .status(201)
        .json(new ApiResponse(201, mailStatus, 'Verification mail sent successfully on registered email-id.'))
})

const renewAccessAndRefreshToken = asyncHandler(async(req, res)=>{
    const oldRefreshToken = req.cookies?.refreshToken
    if (!oldRefreshToken) {
        logger.warn('Refresh token not found in cookies.');
        return res
            .status(400)
            .json(new ApiResponse(400, {forcedLogout: true}, 'FRL'))
    }

    try {
        const decodedUser = jwt.verify(oldRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        if (!decodedUser){
            logger.warn('Invalid refresh token: Failed to verify the token.', decodedUser);
            return res
            .status(401)
            .json(new ApiResponse(401, {forcedLogout: true}, 'FRL')) //forced re-login
        }

        const user = await User.findById(decodedUser._id)
        if(!user){
            logger.warn(`User not found for ID: [${decodedUser._id}].`);
            return res
                .status(404)
                .json(new ApiResponse(404, {forcedLogout: true}, 'FRL'))
        }

        const {accessToken, refreshToken} =  await generateAccessAndRefreshToken(user._id)
        if (!accessToken || !refreshToken){
            return res
                .status(500)
                .json(new ApiResponse(500, {forcedLogout: false}, 'Try again'))
        }
        
        user.refreshToken = refreshToken
        await user.save()
    
        const plainUser = user.toObject()
        plainUser.accessToken = accessToken
        delete plainUser.refreshToken
        delete plainUser.password
        delete plainUser.createdAt
        delete plainUser.updatedAt
        delete plainUser.permissions
        
        logger.info(`Tokens generated successfully for user ID: [${user._id}].`);
        return res
            .status(200)
            .cookie('accessToken', accessToken, options)
            .cookie('refreshToken', refreshToken, options)
            .json(new ApiResponse(200, {}, 'Tokens refreshed.'))

    } catch (error) {
        logger.error('Invalid refresh token: Failed to verify the token.', error);
        return res
            .status(401)
            .json(new ApiResponse(401, {forcedLogout: true}, 'FRL'))
    }
})

const registerUser = asyncHandler( async (req, res) => {
    const { username, fullname, email, password } = req.body
    const avatarFilePath = req.file?.path

    if (!password){
        removeTempFile(avatarFilePath)
        logger.warn('Validation failed: Password is required.');
        return res
            .status(422)
            .json(new ApiError(422, 'Password is required.'))
    }

    if (![username, fullname, email].every((field)=> field?.trim()) ){
        removeTempFile(avatarFilePath)
        logger.warn('Validation failed: All fields (username, fullname, email, and password) are required.');
        return res
            .status(422)
            .json(new ApiError(422, 'All fields (username, fullname, email, and password) are required.'))
    }

    const existingUser =  await User.findOne({ $or: [{ username }, { email }] })
    if (existingUser) {
        removeTempFile(avatarFilePath)
        logger.warn('Registration failed: Username or email already exists.');
        return res
            .status(409)
            .json(new ApiError(409, 'Username or email already exists'))
    }

    let avatar = ""
    if (avatarFilePath){
        avatar = await uploadOnCloudinary(avatarFilePath, 'image')
    }
    
    const user = await User.create(
        {
            username,
            fullname,
            email,
            password,
            avatar: avatar?.url || "",
        }
    )

    if (!user){
        removeTempFile(avatarFilePath)
        logger.error('User registration failed: An error occurred while saving to the database.');
        return res
            .status(500)
            .json(new ApiError(500, 'Something went wrong. Please try again later.'))
    }

    const mailStatus = await sendMailToVerify(user)
    if(!mailStatus.success){
        console.log(mailStatus)
    }

    logger.info(`User ${user.username} registered successfully.`);
    return res
        .status(201)
        .json(new ApiResponse(201, {}, `User registered successfully`))
})

const loginUser = asyncHandler( async (req, res) => {
    const { username, password } = req.body
    if (!username){
        logger.warn('Validation failed: Username or email is required for login.');
        return res
            .status(400)
            .json(new ApiResponse(400, {}, 'Username or email is required for login.'))
    }
    // sanitize if required username and email
    // const newUsername = username.toLowerCase().trim()
    // const newEmail = email.toLowerCase().trim()
    const user = await User.findOne({$or: [{username},{email: username}]})
    if (!user){
        logger.warn(`Login failed: User not found for username or email [${username}].`);
        return res
            .status(404)
            .json(new ApiError(404, 'User not found'))
    }

    const validUser = await user.isValidPassword(password)
    if (!validUser){
        logger.warn(`Login failed: Invalid password for user [${user.username}].`);
        return res
            .status(401)
            .json(new ApiError(401, 'Invalid password'))
    }

    if ( user.permissions.length < rolePermissions[user.role].length ){
        user.permissions = rolePermissions[user.role]
        await user.save()
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)
    if ( !accessToken || !refreshToken){
        return res
            .status(500)
            .json(new ApiError(500, 'Something went wrong. Please try again'))
    }
    
    const plainUser = user.toObject()
    plainUser.accessToken = accessToken
    delete plainUser.refreshToken
    delete plainUser.password
    delete plainUser.createdAt
    delete plainUser.updatedAt
    delete plainUser.__v
    delete plainUser.permissions

    logger.info(`User [${plainUser.username}] logged in successfully.`);
    return res
        .status(200)
        .cookie('accessToken', accessToken, options)
        .cookie('refreshToken', refreshToken, options)
        .json(new ApiResponse(200, plainUser, `${plainUser.username} login successfull`))
})

const logout = asyncHandler(async(req, res) => {
    const user = req.user
    await User.updateOne({_id: user._id}, {$unset: {refreshToken: ""}})
    logger.info(`User [${user.username}] logged out successfully.`);
    return res
        .status(200)
        .cookie('accessToken', "", options)
        .cookie('refreshToken', "", options)
        .json(new ApiResponse(200, {}, `${user.username} logged out`))
})

// jwt decode and provide user from id
const userActivation = asyncHandler(async(req, res)=> {
    const { token } = req.query
    if (!token) {
        logger.warn('Validation failed: Token is required in query parameters.');
        return res
            .status(404)
            .json(new ApiError(404, 'Token is required in query parameters.'))
    }

    // decode _id and verify from jwt 
    const decodedToken = await verifyEmailToken(token)
    if (!decodedToken){
        logger.warn('Email verification failed: Invalid or expired token.');
        return res
            .status(401)
            .send(tokenExpiredResponse())
    }
// need to modify tokenExpiryResponse template to generic -- 
    const user = await User.findById(decodedToken._id)
    if (!user){
        logger.warn(`Email verification failed: User not found for ID [${decodedToken._id}].`);
        return res
            .status(400)
            .send(tokenExpiredResponse())
    }

    user.isActiveUser = true
    await user.save()

    logger.info(`Email verification successful for user ID: [${user._id}].`);
    return res
        .status(200)
        .send(generateVerificationResponse())
})

const updateAvatar = asyncHandler(async(req, res)=> {
    const avatarFilePath = req.file?.path
    if (!avatarFilePath) {
        logger.warn('Validation failed: Avatar file path is required.');
        return res
            .status(400)
            .json(new ApiError(400, 'Avatar file required'))
    }
    
    const oldAvatar = req.user.avatar
    const uploadResponse = await uploadOnCloudinary(avatarFilePath, 'image')
    if (!uploadResponse) {
        return res
            .status(500)
            .json(new ApiError(500, 'Something went wrong. Please try again.'))
    }

    const user = await User.findByIdAndUpdate(req.user._id, 
        {
            avatar: uploadResponse.url
        },
        {
            new: true
        }
    ).select('-password -refreshToken -permissions -createdAt -updatedAt -__v')
    
    if (!user){
        logger.warn(`Avatar update failed: User not found for ID [${req.user._id}].`);
        return res
            .status(500)
            .json(new ApiError(500, 'Something went wrong. Please try again.'))
    }

    deleteFromCloudinary(oldAvatar, "",  'image')
    logger.info(`Avatar updated successfully for user ID: [${user._id}].`);
    return res
        .status(200)
        .json(new ApiResponse(200, user, 'Avatar updated successfully'))
})

// forgot password through login-jwt-verify
const updatePasswordWithJWT = asyncHandler(async(req, res)=>{
    const { current, newPassword, confirm } = req.body
    if (!(current && newPassword && confirm)){
        return res
        .status(400)
        .json(new ApiResponse(401, {}, 'All fields(current password, new password, confirm password) are required.'))
    }

    if ( newPassword !== confirm ){
        return res
        .status(400)
        .json(new ApiResponse(400, {}, 'New and cofirm password not match'))
    }
    const user = await User.findById(req.user._id)
    const validUser = await user.isValidPassword(current)
    if(!validUser){
        return res
            .status(401)
            .json(new ApiResponse(401, {}, 'Invalid current password'))
    }

    user.password = newPassword
    const savePassword = await user.save()

    if(!savePassword){
        return res
            .status(500)
            .json(new ApiResponse(500, {}, 'Something went wrong while updating password. Please try again'))
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)
    const plainUser = user.toObject()
    delete plainUser.refreshToken
    delete plainUser.password
    delete plainUser.createdAt
    delete plainUser.updatedAt
    delete plainUser.__v
    delete plainUser.permissions

    return res
        .status(200)
        .cookie('accessToken', accessToken, options)
        .cookie('refreshToken', refreshToken, options)
        .json(new ApiResponse(200, plainUser, 'Password updated successfully') )

})

const updateEmailBeforeVerification = asyncHandler(async (req, res) => {
    const user = req.user
    // try {
        if (user.isActiveUser) {
            return res
                .status(400)
                .json(new ApiError(400, "Already active user. Unable to change email ID now."));
        }

        const { emailId } = req.body;

        if (!emailId) {
            return res
                .status(400)
                .json(new ApiError(400, "Email ID cannot be blank."));
        }

        if (emailId === user.email) {
            return res
                .status(400)
                .json(new ApiError(400, "You're already using this email. Please enter a different email address."));
        }

        const updatedUser = await User.findOneAndUpdate(
            { _id: user._id },
            { $set: { email: emailId } },
            { new: true, runValidators: true }
        ).select("_id username email fullname avatar role isActiveUser");

        if (!updatedUser) {
            return res
                .status(500)
                .json(new ApiError(500, "Something went wrong while updating the email. Please try again."));
        }

        const mailStatus = await sendMailToVerify(updatedUser)
        if(!mailStatus.success){
            console.log(mailStatus)
        }

        return res
            .status(200)
            .json(new ApiResponse(200, updatedUser, "Your email ID has been successfully updated."));

    // } catch (error) {
    //     if (error.code === 11000) {
    //         return res
    //             .status(409)
    //             .json(new ApiError(409, "This email is already registered with another user."));
    //     }
    //     return res
    //         .status(500)
    //         .json(new ApiError(500, "Internal Server Error. Please try again later."));
    // }
});


// forgot password through verification link
const sendPasswordResetOnMail = asyncHandler(async(req, res)=>{
    const { email } = req.body
    if(!email){
        // throw new ApiError(400, 'Email-ID is required to reset password.')
        return res
            .status(400)
            .json(new ApiResponse(400, {}, 'Email-ID is required to reset the password.'))
    }

    const user = await User.findOne({email: email})
    if(!user){
        // throw new ApiError(404, 'User is not registered.')
        return res
            .status(404)
            .json(new ApiResponse(404, {}, 'User is not registered.'))
    }

    const sentMail = await sendVerificationLink(new ApiEmail(
        email, 
        user.fullname, 
        'Reset Password', 
        'Click on the button below to reset password for your account:',
        '/users/passwd-reset-form',
        generateRandomKey(user._id))
    )

    if(!sentMail){
        // throw new ApiError(500, 'Something went wrong while sending reset email. Please try again after some time.')
        return res
            .status(500)
            .json(new ApiResponse(500, {}, 'An error occurred while sending the password reset email. Please try again later.'))
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, `Password reset link send to ${email}, please check your inbox.`))
})

const sendPasswordSubmitForm = asyncHandler(async(req, res)=>{
    const { token } = req.query
    if(!token){
        // need to send html page to user
        throw new ApiError(400, 'Token cannot be blank')
    }

    const decodedToken = verifyEmailToken(token)
    if(!decodedToken){
        // return link expired message.
        throw new ApiError(401, 'Token Expired')
    }

    const shortLiveKey = generateRandomKey(decodedToken._id)
    return res
        .status(202)
        .cookie('shortLiveKey', shortLiveKey, {httpOnly: true, secure: true, maxAge: 600000})
        .send(submitPasswordForm())
})

const updatePasswordWithEmail = asyncHandler(async(req, res)=>{
    const { shortLiveKey } = req.cookies
    const { newPassword, confirmPassword } = req.body

    if(!(newPassword && confirmPassword)){
        throw new ApiError(400, 'All fields(newPassword, confirmPassword) are required.')
    }

    if(!shortLiveKey){
        return res
            .status(400)
            .send(tokenExpiredResponse())
    }

    const decodedToken = await verifyEmailToken(shortLiveKey)
    if (!decodedToken){
        return res
            .status(403)
            .send(tokenExpiredResponse())
    }

    const user = await User.findById(decodedToken._id)
    if(!user){
        throw new ApiError(404, 'User not found')
    }
    user.password = newPassword
    const isSaved = await user.save()
    if (!isSaved){
        throw new ApiError(500, 'Something went wrong while updating password. Please try again after some time.')
    }

    return res
        .status(200)
        .cookie('shortLiveKey', "", options)
        .send(generateVerificationResponse())
})

const getEvents = asyncHandler(async(_, res)=>{
    const events = await Event.find().select("-createdAt -updatedAt -__v");
    if(!events){
        return res 
            .status(500)
            .json(new ApiError(500, 'Something went wrong, please try again'))
    }

    return res
        .status(200)
        .json(new ApiResponse(200, events, 'Events fetched successfully'))
})

const getCatalogue = asyncHandler(async(_, res)=>{
    const gameCatalogue = await Catalogue.find().select('-owner -createdAt -updatedAt -__v')
    if(!gameCatalogue){
        return res 
        .status(500)
        .json(new ApiResponse(500, {}, 'Something went wrong, please try again'))
    }

    return res
        .status(200)
        .json(new ApiResponse(200, gameCatalogue, 'Game catalogue fetched successfully.'))
})

const getPlans = asyncHandler ( async( _, res ) => {
    const plans = await SubscriptionModels.find().select('-createdAt -updatedAt -__v')
    if(!plans){
        return res 
        .status(500)
        .json(new ApiResponse(500, {}, 'Something went wrong, please try again'))
    }

    return res
        .status(200)
        .json(new ApiResponse(200, plans, 'Subscription details fetched successfully.'))
})

const bookSlot = asyncHandler(async(req, res)=>{
    const { date, timeFrame } = req.body
    if ( !date || !timeFrame){
        return res
            .status(400)
            .json(new ApiError(400, 'All fields(date "yyyy-mm-dd", timeFrame "09AM-10AM") are required.'))
    }

    let slot = await Slot.findOne({date: new Date(date), timeFrame})
    if(!slot){
        slot = new Slot({date: new Date(date), timeFrame})
        await slot.save()
    }

    const existingBookingsCount = await Booking.countDocuments({slotId: slot._id})
    if ( existingBookingsCount >= slot.maxBookings ){
        return res
            .status(409)
            .json(new ApiResponse(409, {}, `${timeFrame} Slot is full.`))
    }

    const booking = await Booking.create(
        {
            slotId: slot._id, 
            userId: req.user?._id,
            expiresAt: slot.date
        }
    )

    if(!booking){
        return  res
            .status(500)
            .json(new ApiError(500, 'Something went wrong.'))
    }

    return res
        .status(200)
        .json(new ApiResponse(200, booking, `${timeFrame} Slot booked succesfully.`))
})

const viewBookedSlots = asyncHandler(async(req, res)=>{
    const userId = req.user?._id
    if(!userId){
        return res
            .status(400)
            .json(new ApiError(400, 'User Id cannot be empty.'))
    }

    if(!isValidObjectId(userId)){
        return res
            .status(400)
            .json(new ApiError(400, 'Invalid user id.'))
    }

    const myBookings = await Booking.aggregate([
        {
            $match: { 
                userId
            }
        },
        {
            $project: {
                slotId: 1
            }
        },
        {
            $lookup: {
                from: 'slots',
                localField: 'slotId',
                foreignField: '_id',
                as: 'slotDetails'
            }
        },
        {
            $unwind: {
                path: '$slotDetails',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                _id: 1,
                date: '$slotDetails.date',
                timeFrame: '$slotDetails.timeFrame'
            }
        }
    ])

    if(!myBookings || !myBookings.length){
        return res
            .status(404)
            .json(new ApiResponse(404, {}, 'No bookings yet.'))
    }

    return res
        .status(200)
        .json(new ApiResponse(200, myBookings, 'Bookings fetched.'))
})

const deleteBookedSlot = asyncHandler(async(req, res)=>{
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

    const destroy = await Booking.findOneAndDelete({_id: bookingId, userId: req.user._id})
    
    if(!destroy){
        return res
            .status(404)
            .json(new ApiError(404, 'Booking not found or access denied.'))
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, `Booking cancelled.`))
})

const getAvailableSlots = asyncHandler(async(req, res)=>{
    const availableSlots = await Slot.aggregate([
        {
            $lookup: {
                from: 'bookings',
                localField: '_id',
                foreignField: 'slotId',
                as: 'bookings'
            }
        },
        {
            $project: {
                _id: 1,
                date: 1,
                timeFrame: 1,
                availableSlots: {
                    $subtract: ['$maxBookings', { $size: '$bookings'}]
                }
            }
        }
    ])

    if(!availableSlots || !availableSlots?.length){
        return res
            .status(404)
            .json(new ApiError(404, 'Slots not created yet.'))
    }

    return res
        .status(200)
        .json(new ApiResponse(200, availableSlots, 'Available slots fetched successfully.'))
})

const keepAlive = asyncHandler(async(req, res) => {
    const SEQ_NUM = req.params?.sequenceId
    console.log(`[${new Date().toISOString()}] Heart_Beat_REQ-[${SEQ_NUM}]: RECEIVED`)

    if (!SEQ_NUM){
        console.log(`[${new Date().toISOString()}] Heart_Beat_RES-[]: SENT OK`)
        return res
            .status(400)
            .json(new ApiResponse(400, {status: 'OK'}, 'SEQ_NUM is missing'))
    }

    console.log(`[${new Date().toISOString()}] Heart_Beat_RES-[${SEQ_NUM}]: SENT OK`)    
    return res
        .status(200)
        .json(new ApiResponse(200, { SEQ_NUM, status: 'OK' }, `${SEQ_NUM}: OK`))
})

export {
    registerUser,
    loginUser,
    logout,
    userActivation,
    updateAvatar,
    updatePasswordWithJWT,
    updateEmailBeforeVerification,
    sendPasswordResetOnMail,
    sendPasswordSubmitForm,
    updatePasswordWithEmail,
    sendVerificationEmail,
    getEvents,
    getCatalogue,
    renewAccessAndRefreshToken,
    getPlans,
    bookSlot,
    viewBookedSlots,
    deleteBookedSlot,
    getAvailableSlots,
    keepAlive,
}