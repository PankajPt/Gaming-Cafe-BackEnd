import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.middleware.js'
import { viewUsers } from '../controllers/user.controller.js'
import { createManager } from '../controllers/admin.controller.js'

const adminRouter = Router()

// secure routes
adminRouter.use(verifyJWT)
adminRouter.route('/view-users').get(viewUsers)
adminRouter.route('/create-manager').post(createManager)


export default adminRouter