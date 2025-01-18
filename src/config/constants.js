const DB_NAME = "MADGEAR"
const SENDER_NAME = "MadGear Team"
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
    SENDER_NAME
}