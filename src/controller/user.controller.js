import fs from 'fs'
import asyncHandler from '../utils/asyncHandler.js'
import ApiError from '../utils/apiError.js'
import ApiResponse from '../utils/apiResponse.js'
import uploadOnCloudinary from '../utils/cloudinary.js'
import User from '../models/user.model.js'
import jwt from 'jsonwebtoken'
import sendVerificationLink from '../utils/emailServices.js'
import { generateVerificationResponse } from './utils/index.template.js'

const  options = {
    httpOnly: true,
    secure: true
  }

const ignoreFields = {
    user: ['password', 'refreshToken', 'role', 'permissions', 'randomkey'],
    manager: ['password', 'refreshToken', 'randomkey'],
    admin: ['password', 'refreshToken', 'randomkey']
}

const removeTempFile = async(file) => {
    await file && fs.unlinkSync(file)
}

const generateAccessAndRefreshToken = async(userID) => {

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
}

const verificationLink = asyncHandler(async(email)=> {
    const user = User.findOne(email)
    const randomKey = await user.generateRandomKey()
    const link = `https://your-domain.com/api/v1/user/verify-email?token=${randomKey}`
    const sentMail = await sendVerificationLink(email, user.fullname, link)
    return sentMail
})

const registerUser = asyncHandler( async (req, res) => {
    const { username, fullname, email, password } = req.body
    const avatarFilePath = req.file?.avatar[0]?.path

    if ([username, fullname, email, password].some((field)=> !field) ){
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

    user.mailStatus = await verificationLink(email)

    const role = user.role
    ignoreFields[role].forEach((field) => delete user.field)

    removeTempFile(avatarFilePath)
    // at frontend check user.mailStatus to check status of verification mail sent to user
    // add symbol or function to display verified user.
    return res
        .status(201)
        .json(new ApiResponse(201, user, `User registered successfully`))
})

const loginUser = asyncHandler( async (req, res) => {
    const { username, email, password } = req.body

    if (!(username && email)){
        throw new ApiError(400, 'Login required username or email-id')
    }

    const user = await User.findOne({$or: [{username},{email}]})
    if (!user){
        throw new ApiError(404, 'User not found')
    }

    const validUser = await user.isValidPassword(password)
    if (!validUser){
        throw new ApiError(401, 'Password Invalid')
    }

    if ( user.isActiveUser === 'inactive' ){
        verificationLink(user.email)
    }

    const { accessToken, refreshToken } = generateAccessAndRefreshToken(user._id)
    const role = user.role
    ignoreFields[role].forEach((field)=>{
        delete user.field
    })

    return res
        .status(200)
        .json(new ApiResponse(200, {user, accessToken, refreshToken}, `${user.username} login successfull`))
        .cookie('accessToken', accessToken, options)
        .cookie('refreshToken', refreshToken, options)

})

// jwt decode and provide user from id
const verifyEmailToken = asyncHandler(async(req, res)=> {
    const { token } = req.query
    if (!token) {
        throw new ApiError(404, 'Invalid Authentication Token')
    }

    // decode _id and verify from jwt 
    const decodedToken = await jwt.verify(token, process.env.RANDOM_KEY_SECRET)
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

})

const updateAvatar = asyncHandler(async()=> {
    const avatarFilePath = req.files?.avatar[0]?.path
    if (!avatarFilePath) {
        throw new apiError(400, 'Avatar file required')
    }

    const uploadResponse = await uploadOnCloudinary(avatarFilePath, 'image')

    const response = User.findByIdAndUpdate(req.user._id, 
        {
            
        }
    )
    

})

export {
    registerUser,
    loginUser,
    verifyEmailToken,
    verificationLink
}