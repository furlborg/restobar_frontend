import axios from "axios";
import { useUserStore } from "@/store/modules/user";
import { sleep } from "@/utils";

export const http = axios.create({
  baseURL: `${process.env.VUE_APP_API_URL}/api/v1/`,
});

http.interceptors.request.use((request) => {
  const userStore = useUserStore();
  if (userStore.token) {
    request.headers.common.Authorization = `Bearer ${userStore.token}`;
  }
  return request;
});

http.interceptors.response.use(async (response) => {
  if (process.env.NODE_ENV === "development") {
    await sleep();
  }
  return response;
}, async function (error) {
  const userStore = useUserStore();
  const originalRequest = error.config;
  if (error.response.status === 401 && !originalRequest._retry) {
    if (error.response.data.code === 'token_not_valid') {
      originalRequest._retry = true;
      userStore.token = null
      await userStore.updateToken();
      originalRequest.headers.Authorization = `Bearer ${userStore.token}`
      return http(originalRequest);
    } else {
      return Promise.reject(error);
    }
  }
  return Promise.reject(error);
});
