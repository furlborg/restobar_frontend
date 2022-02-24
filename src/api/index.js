import axios from "axios";
import { useUserStore } from "@/store/modules/user";
import { sleep } from "@/utils";

export const http = axios.create({
  baseURL: "http://192.168.1.37:8000/api/v1/",
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
});
