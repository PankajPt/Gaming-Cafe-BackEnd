import { Router } from 'express'
import {
    registerUser, loginUser, logout,
    userActivation, updateAvatar, updatePasswordWithJWT,
    sendPasswordResetOnMail, sendPasswordSubmitForm, 
    updatePasswordWithEmail, sendVerificationEmail,
    getEvents, getCatalogue, renewAccessAndRefreshToken, 
    getPlans, bookSlot, viewBookedSlots,
<<<<<<< HEAD
    deleteBookedSlot, getAvailableSlots } from '../controllers/user.controller.js'
=======
    deleteBookedSlot, getAvailableSlots, keepAlive,
    updateEmailBeforeVerification, } from '../controllers/user.controller.js'
>>>>>>> 53ff05309e42b9a78f20899b6c8740d07856756d
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
<<<<<<< HEAD
=======
userRouter.route('/heartbeat/:sequenceId').get(keepAlive)

>>>>>>> 53ff05309e42b9a78f20899b6c8740d07856756d

// secure routes
userRouter.use(verifyJWT)
userRouter.route('/update-avatar').patch(uploadUserFile.single('avatar'), updateAvatar)
userRouter.route('/logout').get(logout)
userRouter.route('/reset-passwd-jwt').post(updatePasswordWithJWT)
userRouter.route('/update-email').post(updateEmailBeforeVerification)
userRouter.route('/send-verification-link').get(sendVerificationEmail)
userRouter.route('/book-slot').post(bookSlot)
userRouter.route('/view-slots').get(viewBookedSlots)
userRouter.route('/delete-slot/:bookingId').delete(deleteBookedSlot)

export default userRouter