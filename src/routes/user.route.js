import { Router } from 'express'
import {
    registerUser, loginUser, logout,
    userActivation, updateAvatar, updatePasswordWithJWT,
    sendPasswordResetOnMail, sendPasswordSubmitForm, 
    updatePasswordWithEmail, sendVerificationEmail,
    getEvents, getCatalogue, sendVerificationMailOverJWT } from '../controllers/user.controller.js'
import { uploadUserFile } from '../middleware/multer.middleware.js'
import { verifyJWT } from '../middleware/auth.middleware.js'


const userRouter = Router()

userRouter.route('/register').post(uploadUserFile.single('avatar'), registerUser)
userRouter.route('/login').post(loginUser)
userRouter.route('/verify-email').get(userActivation)
userRouter.route('/reset-passwd-onEmail').post(sendPasswordResetOnMail)
userRouter.route('/passwd-reset-form').get(sendPasswordSubmitForm)
userRouter.route('/update-passwd-mdb').post(updatePasswordWithEmail)
userRouter.route('/events').get(getEvents)
userRouter.route('/catalogue').get(getCatalogue)

// secure routes
userRouter.use(verifyJWT)
userRouter.route('/verify-email-jwt').get(sendVerificationMailOverJWT)
userRouter.route('/update-avatar').patch(uploadUserFile.single('avatar'), updateAvatar)
userRouter.route('/logout').get(logout)
userRouter.route('/reset-passwd-jwt').post(updatePasswordWithJWT)
userRouter.route('/send-verification-link').get(sendVerificationEmail)

export default userRouter