import { Router } from 'express';
import { confirmAdminRole } from '../middleware/auth.middleware.js'
import { viewUsers, createManager } from '../controllers/admin.controller.js'

const adminRouter = Router()

// secure routes
adminRouter.use(confirmAdminRole)
adminRouter.route('/view-users').get(viewUsers)
adminRouter.route('/create-manager').post(createManager)


export default adminRouter