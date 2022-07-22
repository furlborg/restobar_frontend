import { http } from "@/api"

export async function getUsers(url) {
    return await http.get(url)
}

export async function retrieveUsers(id) {
    return await http.get(`users/${id}/`)
}

export async function createUsers(user) {
    return await http.post('users/', {
        names: user.names,
        branchoffice: user.branchoffice,
        username: user.username,
        password: user.password,
        email: user.email,
        dni: user.dni,
        user_permission: user.user_permission,
        groups: [user.profile],
    })
}

export async function updateUsers(id, user) {
    return await http.put(`users/${id}/`, {
        names: user.names,
        branchoffice: user.branchoffice,
        username: user.username,
        email: user.email,
        dni: user.dni,
        user_permission: user.user_permission,
        groups: [user.profile],
    })
}

export async function updatePassword(id, pass) {
    return await http.put(`changepassword/${id}/`, {
        password: pass
    })
}

export async function disableUsers(id) {
    return await http.delete(`users/${id}/`)
}

export async function getProfile() {
    return await http.get('profile/')
}

export async function login(username, password) {
    return await http.post('login/', {
        username: username,
        password: password,
    })
}

export async function refreshToken(refresh) {
    return await http.post('login/refresh/', {
        refresh: refresh,
    })
}

export async function logout(refresh) {
    return await http.post('logout/', {
        refresh_token: refresh,
    })
}

export async function listGroups() {
    return await http.get('groups/')
}

export async function listPermissions() {
    return await http.get('permissions/')
}

export async function listUserPermissions(id) {
    return await http.get(`users/${id}/permissions/`)
}

export async function updateUserPermissions(id, perms) {
    return await http.put(`users/${id}/permissions/`,{
        user_permissions: perms
    })
}
