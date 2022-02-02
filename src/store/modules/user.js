import { defineStore } from "pinia"

const useCookie = require('vue-cookies')

export const useUserStore = defineStore('user', {
    state: () => ({
        user: {
            id: '',
            branchoffice: '',
            names: ''
        },
        isAuthenticated: false,
        token: '',
        refresh: ''
    }),
    actions: {
        initializeStore() {
            if (!this.isAuthenticated) {
                useCookie.isKey('token') & useCookie.isKey('refresh') & useCookie.isKey('user-info') ? this.isAuthenticated = true : this.isAuthenticated = false
                localStorage.setItem('isAuthenticated', this.isAuthenticated);
            }
        },
        login(data) {
            this.saveTokens(data.token, data.refresh)
            this.saveUserInfo(data.user)
            this.saveAuthentication()
        },
        saveTokens(token, refresh) {
            useCookie.set('token', token, 60 * 30);
            this.token = token;
            useCookie.set('refresh', refresh, '1d');
            this.refresh = refresh;
        },
        saveUserInfo(user) {
            useCookie.set('user-info', user, 60 * 30)
            this.user = user
        },
        saveAuthentication() {
            this.isAuthenticated = true
            localStorage.setItem('isAuthenticated', String(this.isAuthenticated));
        },
        checkAuthentication() {
            if (localStorage.getItem('isAuthenticated') && useCookie.isKey('token') && useCookie.isKey('refresh') && useCookie.isKey('refresh') && localStorage.getItem('isAuthenticated') == 'true') {
                this.isAuthenticated = true
                this.token = useCookie.get('token')
                this.refresh = useCookie.get('refresh')
                this.user = useCookie.get('user-info')
            } else {
                this.logout()
            }
        },
        logout() {
            useCookie.remove('user-info')
            useCookie.remove('token')
            useCookie.remove('refresh')
            localStorage.removeItem('isAuthenticated')
        }
    }
})