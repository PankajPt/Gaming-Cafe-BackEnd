import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.middleware.js'
import { changeUserRole, addNewGame, deleteGame, createEvent,
    deleteEvent, viewUsers, createSubscriptionPlan,
    deleteSubscriptionPlan, createSlot, deleteSlotById, 
    deleteSlotsByDate, getAllBookedSlots, clearBooking, assignPlanToUser} from '../controllers/admin.controller.js'
import { uploadAdminFile } from '../middleware/multer.middleware.js'

const adminRouter = Router()

// secure routes
adminRouter.use(verifyJWT)
adminRouter.route('/view-users').get(viewUsers)
adminRouter.route('/change-role').post(changeUserRole)
adminRouter.route('/add-new-game').post(uploadAdminFile.single('thumbnail'), addNewGame)
adminRouter.route('/delete-game').delete(deleteGame)
adminRouter.route('/create-event').post(uploadAdminFile.single('thumbnail'), createEvent)
adminRouter.route('/delete-event/:eventId').delete(deleteEvent)
adminRouter.route('/create-new-plan').post(uploadAdminFile.single('paymentQR'), createSubscriptionPlan)
adminRouter.route('/delete-plan/:planId').delete(deleteSubscriptionPlan)
adminRouter.route('/create-slot').post(createSlot)
adminRouter.route('/delete-slot/:slotId').delete(deleteSlotById)
adminRouter.route('/delete-slot').delete(deleteSlotsByDate)
adminRouter.route('/get-bookings').get(getAllBookedSlots)
adminRouter.route('/delete-booking/:bookingId').delete(clearBooking)
adminRouter.route('/assign-plan').post(assignPlanToUser)

export default adminRouter