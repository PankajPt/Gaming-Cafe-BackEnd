import {Router} from 'express'
import fs from 'fs'
import {
    registerUser,
    loginUser } from '../controller/user.controller.js'
import upload from '../middleware/multer.middleware.js'


const userRouter = Router()

userRouter.route('/register').post(upload.single(
    {
        name: avatar,
        maxCount: 1
    }
), registerUser)


export default userRouter