const DB_NAME = "MADGEAR"
const SENDER_NAME = "MadGear Team"
const permissions = {
    VIEW_ALL_USERS: 'view_all_users',
    CREATE_USER: 'create_user',
    DELETE_USER: 'delete_user'
}

const rolePermissions = {
    user: [],
    manager: [permissions.VIEW_ALL_USERS],
    admin: [permissions.VIEW_ALL_USERS, permissions.CREATE_USER, permissions.DELETE_USER]
}

export { 
    DB_NAME,
    permissions,
    rolePermissions,
    SENDER_NAME
}