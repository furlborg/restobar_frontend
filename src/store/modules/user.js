import { defineStore } from "pinia";
import { refreshToken, logout, getActiveUsers } from "@/api/modules/users";
import { releaseMyTableLocks } from "@/api/modules/tables";

import useCookie from "vue-cookies";

/**
 * Calcula los segundos restantes de vida de un JWT
 */
const getTokenDuration = (token) => {
  try {
    const base64Url = token.split(".")[1];
    let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    const payload = JSON.parse(window.atob(base64));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp ? payload.exp - now : null;
  } catch (e) {
    return null;
  }
};

export const useUserStore = defineStore("user", {
  state: () => ({
    user: {
      id: "",
      names: "",
      role: "",
      branchoffice: "",
      branchoffice_des: "",
    },
    isAuthenticated: false,
    token: "",
    refresh: "",
  }),
  actions: {
    initializeStore() {
      if (!this.isAuthenticated) {
        useCookie.isKey("token") &&
        useCookie.isKey("refresh") &&
        useCookie.isKey("user-info")
          ? (this.isAuthenticated = true)
          : (this.isAuthenticated = false);
        localStorage.setItem("isAuthenticated", this.isAuthenticated);
      }
    },
    async login(data) {
      console.info("Login successful:", data);
      this.saveTokens(data.token, data.refresh);
      this.saveUserInfo(data.token);
      this.saveAuthentication();
    },
    saveTokens(token, refresh) {
      const accessDuration = getTokenDuration(token) || 60 * 30;
      const refreshDuration = getTokenDuration(refresh) || "1d";

      useCookie.set("token", token, accessDuration);
      this.token = token;
      useCookie.set("refresh", refresh, refreshDuration);
      this.refresh = refresh;
    },
    saveUserInfo(token) {
      try {
        const base64Url = token.split(".")[1];
        let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        while (base64.length % 4) {
          base64 += "=";
        }
        const payload = JSON.parse(window.atob(base64));
        console.info("Decoded token payload:", payload);

        const user = {
          id: payload.user_id,
          username: payload.username,
          names: payload.names,
          role: payload.role,
          branchoffice: payload.branchoffice,
          branchoffice_des: payload.branchoffice_des,
          user_permissions: payload.user_permissions || [],
        };

        console.info("User info extracted from token:", user);
        const userForCookie = { ...user };
        delete userForCookie.user_permissions;
        useCookie.set("user-info", userForCookie, "");
        this.user = user;
        localStorage.setItem("perms", JSON.stringify(user.user_permissions));
      } catch (e) {
        console.error("Error decoding token:", e);
      }
    },
    saveAuthentication() {
      this.isAuthenticated = true;
      localStorage.setItem("isAuthenticated", String(this.isAuthenticated));
    },
    async checkAuthentication() {
      if (
        localStorage.getItem("isAuthenticated") &&
        useCookie.get("user-info") &&
        useCookie.isKey("refresh") &&
        localStorage.getItem("isAuthenticated") === "true"
      ) {
        this.isAuthenticated = true;
        this.user = useCookie.get("user-info");
        this.user.user_permissions = JSON.parse(localStorage.getItem("perms"));
        this.refresh = useCookie.get("refresh");
        if (
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
    async updateToken() {
      await refreshToken(this.refresh)
        .then((response) => {
          const accessDuration =
            getTokenDuration(response.data.access) || 60 * 30;
          const refreshDuration =
            getTokenDuration(response.data.refresh) || "1d";

          useCookie.set("token", response.data.access, accessDuration);
          useCookie.set("refresh", response.data.refresh, refreshDuration);
          this.token = useCookie.get("token");
          this.refresh = useCookie.get("refresh");
        })
        .catch((error) => {
          console.error(error);
          if (error.response.data.code === "token_not_valid") {
            this.logout();
          }
        })
        .finally(() => {
          console.log("Updating token...");
        });
    },
    async blacklistToken() {
      // 1. Liberar bloqueos de mesas en la base de datos ANTES de invalidar credenciales
      try {
        await releaseMyTableLocks();
      } catch (e) {
        console.warn("Error liberando bloqueos en logout:", e);
      }

      return await logout(this.refresh)
        .then((response) => {
          if (response.status === 205 || response.status === 401) {
            this.logout();
          }
          return true;
        })
        .catch((error) => {
          if (error.response?.data?.code === "token_blacklisted") {
            this.logout();
            return true;
          }
          return false;
        });
    },
    logout() {
      // 2. Cortar y resetear WebSocket para no retener conexiones del usuario saliente
      try {
        import("@/composables/useTableLock")
          .then(({ useTableLock }) => {
            try {
              const { disconnectLockWebSocket } = useTableLock();
              disconnectLockWebSocket();
            } catch (_) {}
          })
          .catch(() => {});
      } catch (e) {
        console.warn("Error desconectando WebSocket en logout:", e);
      }

      useCookie.remove("user-info");
      useCookie.remove("token");
      useCookie.remove("refresh");
      this.isAuthenticated = false;
      localStorage.removeItem("perms");
      localStorage.setItem("isAuthenticated", this.isAuthenticated);
      
      // Realizar una recarga completa para limpiar memoria (Singletons, WebSockets)
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    },
    hasPermission(permission) {
      if (this.user?.role === "ADMINISTRADOR") {
        return true;
      }
      
      let perms = this.user?.user_permissions;
      if (!perms) {
        try {
          perms = JSON.parse(localStorage.getItem("perms") || "[]");
        } catch (e) {
          perms = [];
        }
      }
      if (!Array.isArray(perms)) {
        perms = [];
      }
      
      return perms.some((perm) => perm === permission);
    },
  },
});

export const useActiveUsersStore = defineStore("active-users", {
  state: () => ({
    users: [],
  }),
  getters: {
    usersOptions(state) {
      return state.users.map((user) => ({
        value: user.id,
        label: user.username,
      }));
    },
  },
  actions: {
    async initializeStore() {
      await getActiveUsers()
        .then((response) => {
          if (response.status === 200) {
            this.users = response.data;
          }
        })
        .catch((error) => {
          console.error(error);
        });
    },
  },
});
