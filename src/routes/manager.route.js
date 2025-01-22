import { Router } from 'express'
import { verifyJWT } from '../middleware/auth.middleware.js'
import { viewUsers } from '../controllers/user.controller.js'
const managerRouter = Router()

// secure routes
managerRouter.use(verifyJWT)
managerRouter.route('/view-users', viewUsers)

export default managerRouter
