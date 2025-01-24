import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.middleware.js'
import { viewUsers } from '../controllers/user.controller.js'
import { createManager, addNewGame, deleteGame, createEvent,
    deleteEvent, } from '../controllers/admin.controller.js'
import { uploadAdminFile } from '../middleware/multer.middleware.js'

const adminRouter = Router()

// secure routes
adminRouter.use(verifyJWT)
adminRouter.route('/view-users').get(viewUsers)
adminRouter.route('/create-manager').post(createManager)
adminRouter.route('/add-new-game').post(uploadAdminFile.single('thumbnail'), addNewGame)
adminRouter.route('/delete-game').delete(deleteGame)
adminRouter.route('/create-event').post(uploadAdminFile.single('thumbnail'), createEvent)
adminRouter.route('/delete-event').delete(deleteEvent)

export default adminRouter