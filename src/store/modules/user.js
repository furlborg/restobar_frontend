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

/**
 * Verifica si un token está vencido o a punto de vencer (menos de 30 segundos)
 */
const isTokenExpired = (token) => {
  if (!token) return true;
  const remaining = getTokenDuration(token);
  return remaining === null || remaining <= 30;
};

export const useUserStore = defineStore("user", {
  state: () => ({
    user: {
      id: "",
      names: "",
      role: "",
      branchoffice: "",
      branchoffice_des: "",
      is_owner: false,
      is_superuser: false,
    },
    isAuthenticated: false,
    token: "",
    refresh: "",
  }),
  actions: {
    initializeStore() {
      if (!this.isAuthenticated) {
        const hasToken = useCookie.isKey("token") || !!localStorage.getItem("token");
        const hasRefresh = useCookie.isKey("refresh") || !!localStorage.getItem("refresh");
        const hasUserInfo = useCookie.isKey("user-info") || !!localStorage.getItem("user-info");

        this.isAuthenticated = Boolean(hasToken && hasRefresh && hasUserInfo);
        localStorage.setItem("isAuthenticated", String(this.isAuthenticated));
      }
    },
    async login(data) {
      console.info("Login successful:", data);
      this.saveTokens(data.token, data.refresh);
      this.saveUserInfo(data.token, data.user);
      this.saveAuthentication();
    },
    saveTokens(token, refresh) {
      const accessDuration = getTokenDuration(token) || 60 * 30;
      const refreshDuration = getTokenDuration(refresh) || "1d";

      if (token) {
        useCookie.set("token", token, accessDuration);
        localStorage.setItem("token", token);
        this.token = token;
      }
      if (refresh) {
        useCookie.set("refresh", refresh, refreshDuration);
        localStorage.setItem("refresh", refresh);
        this.refresh = refresh;
      }
    },
    saveUserInfo(token, userData = null) {
      try {
        let payload = {};
        if (token) {
          const base64Url = token.split(".")[1];
          let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
          while (base64.length % 4) {
            base64 += "=";
          }
          payload = JSON.parse(window.atob(base64));
          console.info("Decoded token payload:", payload);
        }

        const user = {
          id: userData?.id ?? payload.user_id,
          username: userData?.username ?? payload.username,
          names: userData?.names ?? payload.names,
          role: userData?.role ?? payload.role,
          is_owner: Boolean(userData?.is_owner ?? payload.is_owner),
          is_superuser: Boolean(userData?.is_superuser ?? payload.is_superuser),
          branchoffice: userData?.branchoffice ?? payload.branchoffice,
          branchoffice_des: userData?.branchoffice_des ?? payload.branchoffice_des,
          user_permissions: userData?.user_permissions ?? payload.user_permissions ?? [],
        };

        console.info("User info extracted:", user);
        const userForCookie = { ...user };
        delete userForCookie.user_permissions;
        useCookie.set("user-info", userForCookie, "");
        localStorage.setItem("user-info", JSON.stringify(userForCookie));
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
      const isAuthFlag = localStorage.getItem("isAuthenticated") === "true";
      let userInfo = null;
      try {
        const storedInfo = localStorage.getItem("user-info");
        userInfo = useCookie.get("user-info") || (storedInfo ? JSON.parse(storedInfo) : null);
      } catch (e) {
        console.error("Error parsing user-info:", e);
        userInfo = null;
      }
      const refresh = useCookie.get("refresh") || localStorage.getItem("refresh");

      if (isAuthFlag && userInfo && refresh) {
        this.isAuthenticated = true;
        this.user = userInfo;
        try {
          const storedPerms = localStorage.getItem("perms");
          this.user.user_permissions = storedPerms ? JSON.parse(storedPerms) : [];
        } catch (e) {
          console.error("Error parsing perms:", e);
          this.user.user_permissions = [];
        }
        this.refresh = refresh;

        const token = useCookie.get("token") || localStorage.getItem("token");
        if (isTokenExpired(token)) {
          await this.updateToken();
        } else {
          this.token = token;
        }
      } else {
        this.logout();
      }
    },
    async updateToken() {
      const refreshVal = this.refresh || localStorage.getItem("refresh");
      if (!refreshVal) {
        this.logout();
        return;
      }

      await refreshToken(refreshVal)
        .then((response) => {
          const accessDuration =
            getTokenDuration(response.data.access) || 60 * 30;
          const refreshDuration =
            getTokenDuration(response.data.refresh) || "1d";

          useCookie.set("token", response.data.access, accessDuration);
          localStorage.setItem("token", response.data.access);
          if (response.data.refresh) {
            useCookie.set("refresh", response.data.refresh, refreshDuration);
            localStorage.setItem("refresh", response.data.refresh);
            this.refresh = response.data.refresh;
          }
          this.token = response.data.access;
        })
        .catch((error) => {
          console.error(error);
          if (error.response?.data?.code === "token_not_valid") {
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
          .then(({ disconnectLockWebSocket }) => {
            try {
              if (typeof disconnectLockWebSocket === 'function') {
                disconnectLockWebSocket();
              }
            } catch (_) {}
          })
          .catch(() => {});
      } catch (e) {
        console.warn("Error desconectando WebSocket en logout:", e);
      }

      useCookie.remove("user-info");
      useCookie.remove("token");
      useCookie.remove("refresh");
      localStorage.removeItem("token");
      localStorage.removeItem("refresh");
      localStorage.removeItem("user-info");
      this.token = "";
      this.refresh = "";
      this.isAuthenticated = false;
      localStorage.removeItem("perms");
      localStorage.setItem("isAuthenticated", "false");
      
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
