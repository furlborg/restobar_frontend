import { defineStore } from "pinia"
import { refreshToken } from "@/api/modules/users";

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
                this.token = useCookie.get('token')
            } else {
                this.logout()
            }
        },
        async updateToken() {
            await refreshToken(this.refresh)
                .then(response => {
                    useCookie.set('token', response.data.access, 60 * 30);
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