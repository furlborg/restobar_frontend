import { defineStore } from "pinia";
import { refreshToken, logout, getActiveUsers } from "@/api/modules/users";

const useCookie = require("vue-cookies");

export const useUserStore = defineStore("user", {
    state: () => ({
        user: {
            id: "",
            names: "",
            role: "",
            branchoffice: "",
            branchoffice_des: ""
        },
        isAuthenticated: false,
        token: "",
        refresh: ""
    }),
    actions: {
        initializeStore() {
            if(!this.isAuthenticated) {
                useCookie.isKey("token") &
                useCookie.isKey("refresh") &
                useCookie.isKey("user-info")
                    ? (this.isAuthenticated = true)
                    : (this.isAuthenticated = false);
                localStorage.setItem("isAuthenticated", this.isAuthenticated);
            }
        },
        login(data) {
            this.saveTokens(data.token, data.refresh);
            this.saveUserInfo(data.user);
            this.saveAuthentication();
        },
        saveTokens(token, refresh) {
            useCookie.set("token", token, 60 * 30);
            this.token = token;
            useCookie.set("refresh", refresh, "1d");
            this.refresh = refresh;
        },
        saveUserInfo(user) {
            localStorage.setItem("perms", JSON.stringify(user.user_permissions));
            delete user.user_permissions;
            useCookie.set("user-info", user, "");
            this.user = user;
        },
        saveAuthentication() {
            this.isAuthenticated = true;
            localStorage.setItem("isAuthenticated", String(this.isAuthenticated));
        },
        async checkAuthentication() {
            if(
                localStorage.getItem("isAuthenticated") &&
                useCookie.get("user-info") &&
                useCookie.isKey("refresh") &&
                localStorage.getItem("isAuthenticated") === "true"
            ) {
                this.isAuthenticated = true;
                this.user = useCookie.get("user-info");
                this.user.user_permissions = JSON.parse(localStorage.getItem("perms"));
                this.refresh = useCookie.get("refresh");
                if(
                    !useCookie.isKey("token") &&
                    localStorage.getItem("isAuthenticated") &&
                    useCookie.get("user-info") &&
                    useCookie.isKey("refresh") &&
                    localStorage.getItem("isAuthenticated") === "true"
                ) {
                    await this.updateToken();
                } else {
                    this.token = useCookie.get("token");
                }
            } else {
                this.logout();
            }
        },
        // async checkToken() {
        //   if (
        //     !useCookie.isKey("token") &&
        //     localStorage.getItem("isAuthenticated") &&
        //     useCookie.get("user-info") &&
        //     useCookie.isKey("refresh") &&
        //     localStorage.getItem("isAuthenticated") === "true"
        //   ) {
        //     await this.updateToken();
        //   } else {
        //     this.token = useCookie.get("token");
        //   }
        // },
        async updateToken() {
            await refreshToken(this.refresh).then((response) => {
                useCookie.set("token", response.data.access, 60 * 30);
                useCookie.set("refresh", response.data.refresh, "1d");
                this.token = useCookie.get("token");
                this.refresh = useCookie.get("refresh");
            }).catch((error) => {
                console.error(error);
                if(error.response.data.code === "token_not_valid") {
                    this.logout();
                }
            }).finally(() => {
              console.log("Updating token...");
          });
        },
        async blacklistToken() {
            return await logout(this.refresh).then((response) => {
                if(response.status === 205 || response.status === 401) {
                    this.logout();
                }
                return true;
            }).catch((error) => {
                if(error.response.data.code === "token_blacklisted") {
                    this.logout();
                    return true;
                }
                return false;
            });
        },
        logout() {
            useCookie.remove("user-info");
            useCookie.remove("token");
            useCookie.remove("refresh");
            this.isAuthenticated = false;
            localStorage.removeItem("perms");
            localStorage.setItem("isAuthenticated", this.isAuthenticated);
        },
        hasPermission(permission) {
            if(this.user.is_superuser) {
                return true;
            }
            return this.user.user_permissions.some((perm) => perm === permission);
        }
    }
});

export const useActiveUsersStore = defineStore("active-users", {
    state: () => ({
        users: []
    }),
    getters: {
        usersOptions(state) {
            return state.users.map((user) => ({
                value: user.id,
                label: user.username
            }));
        }
    },
    actions: {
        async initializeStore() {
            await getActiveUsers().then((response) => {
                if(response.status === 200) {
                    this.users = response.data;
                }
            }).catch((error) => {
                console.error(error);
            });
        }
    }
});
