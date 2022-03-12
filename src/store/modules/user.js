import { defineStore } from "pinia"
import { refreshToken, logout } from "@/api/modules/users";
const useCookie = require('vue-cookies')

export const useUserStore = defineStore('user', {
    state: () => ({
        user: {
            id: '',
            names: '',
            profile_des: '',
            branchoffice: '',
            branchoffice_des: '',
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
            useCookie.set('user-info', user, '')
            this.user = user
        },
        saveAuthentication() {
            this.isAuthenticated = true
            localStorage.setItem('isAuthenticated', String(this.isAuthenticated));
        },
        async checkAuthentication() {
            if (localStorage.getItem('isAuthenticated') && useCookie.get('user-info') && useCookie.isKey('refresh') && localStorage.getItem('isAuthenticated') == 'true') {
                this.isAuthenticated = true
                this.refresh = useCookie.get('refresh')
                this.user = useCookie.get('user-info')
                if (!useCookie.isKey('token') && localStorage.getItem('isAuthenticated') && useCookie.get('user-info') && useCookie.isKey('refresh') && localStorage.getItem('isAuthenticated') == 'true') {
                    await this.updateToken()
                }
            } else {
                this.logout()
            }
        },
        async updateToken() {
            await refreshToken(this.refresh)
                .then(response => {
                    useCookie.set('token', response.data.access, 60 * 30);
                    useCookie.set('refresh', response.data.refresh, '1d');
                    this.token = useCookie.get('token')
                    this.refresh = useCookie.get('refresh')
                })
                .catch(error => {
                    console.error(error, error.response.data)
                    /* if (error.response.data.code === 'token_not_valid') {
                        this.logout()
                    } */
                })
        },
        async blacklistToken() {
            return await logout(this.refresh)
                .then(response => {
                    if (response.status === 205) {
                        this.logout()
                    }
                    return true
                })
                .catch(error => {
                    if (error.response.data.code === 'token_blacklisted') {
                        this.logout()
                        return true
                    }
                    return false
                })
        },
        logout() {
            useCookie.remove('user-info')
            useCookie.remove('token')
            useCookie.remove('refresh')
            this.isAuthenticated = false
            localStorage.setItem('isAuthenticated', this.isAuthenticated)
        }
    }
})