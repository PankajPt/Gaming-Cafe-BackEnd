const DB_NAME = "MADGEAR"
const SENDER_NAME = "MadGear Team"
const REDIRECTIONS = {
    verifyEmail: `https://obscure-space-fortnight-gr6gvg699g5c996g-7557.app.github.dev/api/v1/users/verify-email?token`
}
const BREVO_URI = 'https://api.brevo.com/v3/smtp/email'
const permissions = {
    VIEW_ALL_USERS: 'view_all_users',
    CREATE_USER: 'create_user',
    DELETE_USER: 'delete_user',
    CREATE_EVENT: 'create_event',
    ADD_NEW_GAME: 'add_new_game'
}
const rolePermissions = {
    user: [],
    manager: [permissions.VIEW_ALL_USERS, permissions.CREATE_USER, permissions.ADD_NEW_GAME],
    admin: [permissions.VIEW_ALL_USERS, permissions.CREATE_USER, permissions.DELETE_USER, permissions.CREATE_EVENT, permissions.ADD_NEW_GAME]
}

export { 
    DB_NAME,
    permissions,
    rolePermissions,
    SENDER_NAME,
    REDIRECTIONS,
    BREVO_URI
}