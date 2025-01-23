import fs from 'fs'
import asyncHandler from '../utils/asyncHandler.js'
import ApiError from '../utils/apiError.js'
import ApiResponse from '../utils/apiResponse.js'
import { uploadOnCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js'
import User from '../models/user.model.js'
import jwt from 'jsonwebtoken'
import sendVerificationLink from '../utils/emailServices.js'
import { generateVerificationResponse, tokenExpiredResponse } from '../templates/index.template.js'
import { REDIRECTIONS, rolePermissions, permissions } from '../config/constants.js'


const  options = {
    httpOnly: true,
    secure: true
  }

// const ignoreFields = {
//     user: ['password', 'refreshToken', 'role', 'permissions'],
//     manager: ['password', 'refreshToken'],
//     admin: ['password', 'refreshToken']
// }

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

const verificationLink = async (emailID, title, body) => {
    const user = await User.findOne({email: emailID})
    if (!user){
        throw new ApiError(400, 'User not found')
    }
    const randomKey = await user.generateRandomKey()
    const link = `${REDIRECTIONS.verifyEmail}=${randomKey}`
    const sentMail = await sendVerificationLink(emailID, user.fullname, link, title, body)
    return sentMail
}

const registerUser = asyncHandler( async (req, res) => {
    const { username, fullname, email, password } = req.body
    // console.log(req.file)
    const avatarFilePath = req.file?.path
    
    if (!password){
        removeTempFile(avatarFilePath)
        throw new ApiError(400, 'All fileds(username, fullname, email, password) are required. ')
    }

    if (![username, fullname, email].every((field)=> field?.trim()) ){
        removeTempFile(avatarFilePath)
        throw new ApiError(400, 'All fileds(username, fullname, email, password) are required. ')
    }

    const existingUser =  await User.findOne({ $or: [{ username }, { email }] })
    if (existingUser) {
        removeTempFile(avatarFilePath)
        throw new ApiError(409, 'Username or email already exist')
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
        throw new ApiError(500, 'Something went wrong while registering user in DB')
    }

    const plainUser = user.toObject();
    const title = `Verify Account`
    const body = `body-Click on the button below to verify your account:`

    const mailStatus = await verificationLink(email, title, body)
    plainUser.mailStatus = mailStatus
    delete plainUser.password
    delete plainUser.refreshToken

    // await removeTempFile(avatarFilePath)
    // at frontend check user.mailStatus to check status of verification mail sent to user
    // add symbol or function to display verified user.
    return res
        .status(201)
        .json(new ApiResponse(201, plainUser, `User registered successfully`))
})

const loginUser = asyncHandler( async (req, res) => {
    const { username, email, password } = req.body

    if (!(username || email)){
        throw new ApiError(400, 'Login required username or email-id')
    }
    // sanitize if required username and email
    // const newUsername = username.toLowerCase().trim()
    // const newEmail = email.toLowerCase().trim()
    const user = await User.findOne({$or: [{username},{email}]})
    if (!user){
        throw new ApiError(404, 'User not found')
    }

    const validUser = await user.isValidPassword(password)
    if (!validUser){
        throw new ApiError(401, 'Password Invalid')
    }

    if ( user.permissions.length < rolePermissions[user.role].length ){
        user.permissions = rolePermissions[user.role]
        await user.save()
    }

    // for inactive user send verification link
    if ( user.isActiveUser === 'inactive' ){
        verificationLink(user.email)
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)
    
    const plainUser = user.toObject()
    delete plainUser.refreshToken
    delete plainUser.password

    return res
        .status(200)
        .cookie('accessToken', accessToken, options)
        .cookie('refreshToken', refreshToken, options)
        .json(new ApiResponse(200, {plainUser, accessToken, refreshToken}, `${user.username} login successfull`))

})

const logout = asyncHandler(async(req, res) => {
    const user = req.user
    await User.updateOne({_id: user._id}, {$unset: {refreshToken: ""}})
        return res
            .status(200)
            .cookie('accessToken', '', options)
            .cookie('refreshToken', '', options)
            .json(new ApiResponse(200, {}, `${user.username} logged out`))
})

// jwt decode and provide user from id
const verifyEmailToken = asyncHandler(async(req, res)=> {
    const { token } = req.query
    if (!token) {
        throw new ApiError(404, 'Invalid Authentication Token')
    }

    // decode _id and verify from jwt 
    try {
        const decodedToken = jwt.verify(token, process.env.RANDOM_KEY_SECRET)
        if (!decodedToken) {
            throw new ApiError(401, 'Invalid Token ID')
        }
    
        const user = await User.findById(decodedToken._id)
        if (!user){
            throw new ApiError(400, 'User not found')
        }
    
        user.isActiveUser = 'active'
        await user.save()
    
        return res
            .status(200)
            .send(generateVerificationResponse())
    } catch (error) {
        return res
            .status(401)
            .send(tokenExpiredResponse())
    }

})

const updateAvatar = asyncHandler(async(req, res)=> {
    const avatarFilePath = req.file?.path
    if (!avatarFilePath) {
        throw new ApiError(400, 'Avatar file required')
    }
    
    const oldAvatar = req.user.avatar
    const uploadResponse = await uploadOnCloudinary(avatarFilePath, 'image')
    if (!uploadResponse) {
        removeTempFile(avatarFilePath)
        throw new ApiError(500, `Something went wrong while uploading on cloudinary`)
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
        throw new ApiError(500, `Something went wrong while updating avatar in database`)
    }

    await deleteFromCloudinary(oldAvatar, "",  'image')

    // removeTempFile(avatarFilePath)
    // console.log(deleteAvatar)
    // File http://res.cloudinary.com/dodnkq5do/image/upload/v1737457068/eu3nihjszqtrwgt92nor.png is removed from cloudinary
    // { result: 'ok' }
    // need logging if failed to clear from cloudinary with url.

    return res
        .status(200)
        .json(new ApiResponse(200, user, 'Avatar updated successfully'))
})

// forgot password through login-jwt-verify
const updatePasswordWithJWT = asyncHandler(async(req, res)=>{
    const { current, newPassword, confirm } = req.body
    if (!(current && newPassword && confirm)){
        throw new ApiError(400, 'All fields(current password, new password, confirm password) are required.')
    }

    if ( newPassword !== confirm ){
        throw new ApiError(400, 'New and cofirm password not match')
    }
    const user = await User.findById(req.user._id)
    const validUser = await user.isValidPassword(current)
    if(!validUser){
        throw new ApiError(401, 'Current password not match.')
    }

    user.password = newPassword
    const savePassword = await user.save()

    if(!savePassword){
        throw new ApiError(500, 'Something went wrong while updatin password in DB.')
    }

    const { accessToken, refreshToken } = generateAccessAndRefreshToken(user._id)
    const plainUser = user.toObject()
    delete plainUser.password
    delete plainUser.refreshToken

    return res
        .status(200)
        .cookie('accessToken', accessToken, options)
        .cookie('refreshToken', refreshToken, options)
        .json(200, plainUser, 'Password updated successfully' )

})

// forgot password through verification link
const updatePassword = asyncHandler(async(req, res)=>{

})

// view users
const viewUsers = asyncHandler(async(req, res)=>{
    const requiredPermission = permissions.VIEW_ALL_USERS
    const userPermissions = req.user.permissions
    if (!userPermissions.some((permission) => permission === requiredPermission )){ 
        throw new ApiError(403, 'Access denied: The user does not have permission to view this page.')
    }
    const users = await User.find()
    if (!users){
        throw new ApiError(404, 'No registered users found');
    }

    return res
        .status(200)
        .json(new ApiResponse(200, users, 'Users fetch successfully'))
})

export {
    registerUser,
    loginUser,
    logout,
    verifyEmailToken,
    verificationLink,
    updateAvatar,
    updatePassword,
    viewUsers,
    updatePasswordWithJWT
}