import fs from 'fs'
import asyncHandler from '../utils/asyncHandler.js'
import ApiError from '../utils/apiError.js'
import ApiResponse from '../utils/apiResponse.js'
import ApiEmail from '../utils/apiEmail.js'
import { uploadOnCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js'
import User from '../models/user.model.js'
import Event from '../models/event.model.js'
import Catalogue from '../models/catalogue.model.js'
import SubscriptionModels from '../models/subscription.model.js'
import jwt from 'jsonwebtoken'
import { sendVerificationLink, verifyEmailToken } from '../utils/emailServices.js'
import { generateVerificationResponse, tokenExpiredResponse, submitPasswordForm } from '../templates/index.template.js'
import { rolePermissions, permissions } from '../config/constants.js'


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
            throw new ApiError(400, 'User not found')
        }
        
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()
        
        if (!(accessToken || refreshToken)){
            throw new ApiError(500, 'Something went wrong while generating access and refresh token')
        }
        
        user.refreshToken = refreshToken
        await user.save() //validate before save
        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, 'Something went wrong while generationg access and refresh token')
    }
}

const generateRandomKey = (userId)=>{
    return jwt.sign({_id: userId}, process.env.RANDOM_KEY_SECRET, {expiresIn: process.env.RAMDOM_KEY_EXPIRY})
}
// function to create send mail
const sendMailToVerify = async(user) => {
    if (!user){
        throw new ApiError(400, 'User not specified')
    }

    try {
        const sendMail = await sendVerificationLink(new ApiEmail(
            user.email,
            user.fullname,
            `Verify Account`,
            `Click on the button below to verify your account:`,
            `/users/verify-email`,
            generateRandomKey(user._id)
        ))

        return sendMail
    } catch (error) {
        console.log(error)
        return false
    }
}
// api to send verification mail
const sendVerificationEmail = asyncHandler(async(req, res)=>{
    const user = req.user
    const mailStatus = await sendMailToVerify(user)
    if(!mailStatus){
        console.log('Something went wrong while sending mail')
        return res
        .status(500)
        .json(new ApiResponse(500, {}, 'Something went wrong, Please try again'))
    }
    return res
        .status(201)
        .json(new ApiResponse(201, mailStatus, 'Verification mail sent successfully on registered email-id.'))
})

const renewAccessAndRefreshToken = asyncHandler(async(req, res)=>{
    const oldRefreshToken = req.cookies?.refreshToken
    if ( !oldRefreshToken ) {
        return res
            .status(400)
            .json(new ApiResponse(400, {forcedLogout: true}, 'FRL'))
    }

    try {
        const decodedUser = jwt.verify(oldRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        if (!decodedUser){
            return res
            .status(401)
            .json(new ApiResponse(401, {forcedLogout: true}, 'FRL')) //forced re-login
        }

        const user = await User.findById(decodedUser._id)
        if(!user){
            return res
                .status(404)
                .json(new ApiResponse(404, {forcedLogout: true}, 'FRL'))
        }

        const {accessToken, refreshToken} =  await generateAccessAndRefreshToken(user._id)
        if (!(accessToken && refreshToken)){
            return res
                .status(500)
                .json(new ApiResponse(500, {forcedLogout: false}, 'Try again'))
        }
        
        user.refreshToken = refreshToken
        await user.save()
    
        // const plainUser = user.toObject()
        // delete plainUser.refreshToken
        // delete plainUser.password
        // delete plainUser.createdAt
        // delete plainUser.updatedAt
        // delete plainUser.permissions
        
        return res
            .status(200)
            .cookie('accessToken', accessToken, options)
            .cookie('refreshToken', refreshToken, options)
            .json(new ApiResponse(200, {}, 'Tokens refreshed.'))

    } catch (error) {
        console.log(error)
        return res
            .status(401)
            .json(new ApiResponse(401, {forcedLogout: true}, 'FRL'))
    }
})

const registerUser = asyncHandler( async (req, res) => {
    const { username, fullname, email, password } = req.body
    // console.log(req.file)
    const avatarFilePath = req.file?.path
    console.log(req.file)
    if (!password){
        removeTempFile(avatarFilePath)
        // throw new ApiError(400, 'All fileds(username, fullname, email, password) are required. ')
        return res
            .status(422)
            .json(new ApiResponse(422, {}, 'Password is required.'))
    }

    if (![username, fullname, email].every((field)=> field?.trim()) ){
        removeTempFile(avatarFilePath)
        // throw new ApiError(400, 'All fields (username, fullname, email, and password) are required.');
        return res
        .status(422)
        .json(new ApiResponse(422, {}, 'All fields (username, fullname, email, and password) are required.'))
    }

    const existingUser =  await User.findOne({ $or: [{ username }, { email }] })
    if (existingUser) {
        removeTempFile(avatarFilePath)
        // throw new ApiError(409, 'Username or email already exist')
        return res
        .status(409)
        .json(new ApiResponse(409, {}, 'Username or email already exists'))
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
        // throw new ApiError(500, 'An error occurred while registering the user in the database.');
        return res
        .status(500)
        .json(new ApiResponse(500, {}, 'Something went wrong. Please try again later.'))
    }

    const mailStatus = await sendMailToVerify(user)
    if(!mailStatus){
        console.log('Something went wrong while sending mail')
    }
    // const plainUser = user.toObject();
    // plainUser.mailStatus = mailStatus
    // delete plainUser.password
    // delete plainUser.refreshToken
    // TODO
    // at frontend check user.mailStatus to check status of verification mail sent to user
    // add symbol or function to display verified user.(Done)
    return res
        .status(201)
        .json(new ApiResponse(201, {}, `User registered successfully`))
})

const loginUser = asyncHandler( async (req, res) => {
    const { username, password } = req.body
    if (!username){
        return res
            .status(400)
            .json(new ApiResponse(400, {}, 'Username or email is required for login.'))
    }
    // sanitize if required username and email
    // const newUsername = username.toLowerCase().trim()
    // const newEmail = email.toLowerCase().trim()
    const user = await User.findOne({$or: [{username},{email: username}]})
    if (!user){
        // throw new ApiError(404, 'User not found')
        return res
        .status(404)
        .json(new ApiResponse(404, {}, 'User not found'))
    }

    const validUser = await user.isValidPassword(password)
    if (!validUser){
        // throw new ApiError(401, 'Password Invalid')
        return res
        .status(401)
        .json(new ApiResponse(401, {}, 'Invalid password'))
    }

    if ( user.permissions.length < rolePermissions[user.role].length ){
        user.permissions = rolePermissions[user.role]
        await user.save()
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
        .json(new ApiResponse(200, plainUser, `${user.username} login successfull`))
})

const logout = asyncHandler(async(req, res) => {
    const user = req.user
    await User.updateOne({_id: user._id}, {$unset: {refreshToken: ""}})
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
        throw new ApiError(404, 'Invalid Authentication Token')
    }

    // decode _id and verify from jwt 
    const decodedToken = await verifyEmailToken(token)
    if (!decodedToken){
        return res
        .status(401)
        .send(tokenExpiredResponse())
    }
// need to modify tokenExpiryResponse template to generic -- 
    const user = await User.findById(decodedToken._id)
    if (!user){
        return res
        .status(400)
        .send(tokenExpiredResponse())
    }

    user.isActiveUser = 'active'
    await user.save()
    return res
            .status(200)
            .send(generateVerificationResponse())
})

const updateAvatar = asyncHandler(async(req, res)=> {
    const avatarFilePath = req.file?.path
    if (!avatarFilePath) {
        return res
            .status(400)
            .json(new ApiResponse(400, {}, 'Avatar file required'))
    }
    
    const oldAvatar = req.user.avatar
    const uploadResponse = await uploadOnCloudinary(avatarFilePath, 'image')
    if (!uploadResponse) {
        removeTempFile(avatarFilePath)
        return res
        .status(500)
        .json(new ApiResponse(500, {}, 'Something went wrong. Please try again.'))
    }

    const user = await User.findByIdAndUpdate(req.user._id, 
        {
            avatar: uploadResponse.url
        },
        {
            new: true
        }
    ).select('-password -refreshToken')
    
    if (!user){
        removeTempFile(avatarFilePath)
        return res
        .status(500)
        .json(new ApiResponse(500, {}, 'Something went wrong. Please try again.'))
    }

    await deleteFromCloudinary(oldAvatar, "",  'image')
    // need logging if failed to clear from cloudinary with url.
    const plainUser = user.toObject()
    delete plainUser.refreshToken
    delete plainUser.password
    delete plainUser.createdAt
    delete plainUser.updatedAt
    delete plainUser.__v
    delete plainUser.permissions

    return res
        .status(200)
        .json(new ApiResponse(200, plainUser, 'Avatar updated successfully'))
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
    const events = await Event.find()
    if(!events){
        // throw new ApiError(500, 'Something went wrong while fetching data from DB.')
        return res 
            .status(500)
            .json(new ApiResponse(500, {}, 'Something went wrong, please try again'))
    }

    const plainEvents = events.toObject()
    delete plainEvents.createdAt
    delete plainEvents.updatedAt
    delete plainEvents.__v

    return res
        .status(200)
        .json(new ApiResponse(200, plainEvents, 'Events fetched successfully'))
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

export {
    registerUser,
    loginUser,
    logout,
    userActivation,
    updateAvatar,
    updatePasswordWithJWT,
    sendPasswordResetOnMail,
    sendPasswordSubmitForm,
    updatePasswordWithEmail,
    sendVerificationEmail,
    getEvents,
    getCatalogue,
    renewAccessAndRefreshToken,
    getPlans,

}