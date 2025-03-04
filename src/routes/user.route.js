import { Router } from 'express'
import {
    registerUser, loginUser, logout,
    userActivation, updateAvatar, updatePasswordWithJWT,
    sendPasswordResetOnMail, sendPasswordSubmitForm, 
    updatePasswordWithEmail, sendVerificationEmail,
    getEvents, getCatalogue, renewAccessAndRefreshToken, 
    getPlans, bookSlot, viewBookedSlots,
    deleteBookedSlot, getAvailableSlots, keepAlive } from '../controllers/user.controller.js'
import { uploadUserFile } from '../middleware/multer.middleware.js'
import { verifyJWT } from '../middleware/auth.middleware.js'
// import { upload } from '../middleware/multer.middleware.js'

const userRouter = Router()

userRouter.route('/register').post(uploadUserFile.single('avatar'), registerUser)
userRouter.route('/login').post(loginUser)
userRouter.route('/verify-email').get(userActivation)
userRouter.route('/reset-passwd-onEmail').post(sendPasswordResetOnMail)
userRouter.route('/passwd-reset-form').get(sendPasswordSubmitForm)
userRouter.route('/update-passwd-mdb').post(updatePasswordWithEmail)
userRouter.route('/events').get(getEvents)
userRouter.route('/catalogue').get(getCatalogue)
userRouter.route('/refresh').get(renewAccessAndRefreshToken)
userRouter.route('/subs-plans').get(getPlans)
userRouter.route('/get-slots').get(getAvailableSlots)
userRouter.route('/heartbeat/:sequenceId').get(keepAlive)


// secure routes
userRouter.use(verifyJWT)
userRouter.route('/update-avatar').patch(uploadUserFile.single('avatar'), updateAvatar)
userRouter.route('/logout').get(logout)
userRouter.route('/reset-passwd-jwt').post(updatePasswordWithJWT)
userRouter.route('/send-verification-link').get(sendVerificationEmail)
userRouter.route('/book-slot').post(bookSlot)
userRouter.route('/view-slots').get(viewBookedSlots)
userRouter.route('/delete-slot/:bookingId').delete(deleteBookedSlot)

export default userRouter