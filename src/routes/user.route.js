import { Router } from 'express'
import { registerUser, loginUser, logout, verifyEmailToken, updateAvatar } from '../controllers/user.controller.js'
import upload from '../middleware/multer.middleware.js'
import { verifyJWT } from '../middleware/auth.middleware.js'


const userRouter = Router()

userRouter.route('/register').post(upload.single('avatar'), registerUser)
userRouter.route('/login').post(loginUser)
userRouter.route('/verify-email').get(verifyEmailToken)
// userRouter.route('/events').get()

// secure routes
userRouter.use(verifyJWT)
userRouter.route('/update-avatar').post(upload.single('avatar'), updateAvatar)
userRouter.route('/logout').get(logout)

export default userRouter