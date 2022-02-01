import { defineStore } from "pinia"
export const useUserStore = defineStore('user', {
    state: () => ({
        userId: null,
        names: '',
        branchoffice: null,
        isAuthenticated: false,
        token: '',
        refresh: ''
    }),
    actions: {
        initializeStore(data) {
            this.saveTokens(data.token, data.refresh)
            this.saveUserInfo(data.user)
            this.saveAuthentication()
        },
        saveTokens(token, refresh) {
            localStorage.setItem('token', token);
            this.token = token;
            localStorage.setItem('refresh', refresh);
            this.refresh = refresh;
        },
        saveUserInfo(user) {
            localStorage.setItem('user-info', JSON.stringify(user));
            this.userId = user.id
            this.branchoffice = user.branchoffice
            this.names = user.names
        },
        saveAuthentication() {
            this.isAuthenticated = true
            localStorage.setItem('isAuthenticated', String(this.isAuthenticated));
        },
        checkAuthentication() {
            let user = {}
            localStorage.getItem('token') ? this.token = localStorage.getItem('token') : null
            localStorage.getItem('refresh') ? this.refresh = localStorage.getItem('refresh') : null
            localStorage.getItem('user-info') ? user = JSON.parse(localStorage.getItem('user-info')) : null
            this.userId = user.id
            this.branchoffice = user.branchoffice
            this.names = user.names
            localStorage.getItem('isAuthenticated') ? this.isAuthenticated = localStorage.getItem('isAuthenticated') == 'true' : null
        }
    }
})