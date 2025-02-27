const DB_NAME = "MADGEAR"
const SENDER_NAME = "MadGear Team"
const LOGIN_PAGE = `https://madgear.vercel.app/login`
const REDIRECTIONS = {
    BACKEND_BASE_URL: `https://madgearapi.onrender.com/api/v1`,
    // BACKEND_BASE_URL: `https://obscure-space-fortnight-gr6gvg699g5c996g-7557.app.github.dev/api/v1`
}
const BREVO_URI = 'https://api.brevo.com/v3/smtp/email'
const permissions = {
    VIEW_ALL_USERS: 'view_all_users',
    CREATE_USER: 'create_user',
    DELETE_USER: 'delete_user',
    CREATE_EVENT: 'create_event',
    ADD_NEW_GAME: 'add_new_game',
    DELETE_GAME: 'delete_game',
    DELETE_EVENT: 'delete_event',
    CHANGE_USER_PERMISSION: 'change_user_permission',
    CREATE_SUBSCRIPTION_PLAN: 'create_subscription_plan',
    DELETE_SUBSCRIPTION_PLAN: 'delete_subscription_plan',
    ADD_SLOT: 'add_slot',
    DELETE_SLOT: 'delete_slot',
    VIEW_BOOKINGS: 'view_bookings',
    CLEAR_BOOKING: 'clear_booking'
}
const rolePermissions = {
    user: [],
    manager: [
        permissions.VIEW_ALL_USERS, 
        permissions.CREATE_USER, 
        permissions.ADD_NEW_GAME,
        permissions.VIEW_BOOKINGS,
        permissions.CLEAR_BOOKING
    ],
    admin: [
        permissions.VIEW_ALL_USERS, 
        permissions.CREATE_USER, 
        permissions.DELETE_USER, 
        permissions.CREATE_EVENT, 
        permissions.ADD_NEW_GAME,
        permissions.DELETE_GAME,
        permissions.DELETE_EVENT,
        permissions.CHANGE_USER_PERMISSION,
        permissions.CREATE_SUBSCRIPTION_PLAN,
        permissions.DELETE_SUBSCRIPTION_PLAN,
        permissions.ADD_SLOT,
        permissions.DELETE_SLOT,
        permissions.VIEW_BOOKINGS,
        permissions.CLEAR_BOOKING
    ]
}

export { 
    DB_NAME,
    permissions,
    rolePermissions,
    SENDER_NAME,
    REDIRECTIONS,
    BREVO_URI,
    LOGIN_PAGE
}