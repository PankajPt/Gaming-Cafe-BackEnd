import { Router } from 'express'
import {
    registerUser,
    loginUser,
    logout,
    userActivation,
    updateAvatar,
    updatePasswordWithJWT,
    sendPasswordResetOnMail,
    sendPasswordSubmitForm,
    updatePasswordWithEmail } from '../controllers/user.controller.js'
import { uploadUserFile } from '../middleware/multer.middleware.js'
import { verifyJWT } from '../middleware/auth.middleware.js'


const userRouter = Router()

userRouter.route('/register').post(uploadUserFile.single('avatar'), registerUser)
userRouter.route('/login').post(loginUser)
userRouter.route('/verify-email').get(userActivation)
userRouter.route('/reset-passwd-email').post(sendPasswordResetOnMail)
userRouter.route('/passwd-reset-form').get(sendPasswordSubmitForm)
userRouter.route('/passwd-mdb').post(updatePasswordWithEmail)
// userRouter.route('/events').get()

// secure routes
userRouter.use(verifyJWT)
userRouter.route('/update-avatar').post(uploadUserFile.single('avatar'), updateAvatar)
userRouter.route('/logout').get(logout)
userRouter.route('/reset-passwd-jwt').post(updatePasswordWithJWT)

export default userRouter