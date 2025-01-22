import { Router } from 'express'
import { confirmManagerRole } from '../middleware/auth.middleware.js'

const managerRouter = Router()

// secure routes
managerRouter.use(confirmManagerRole)


export default managerRouter
