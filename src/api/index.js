import axios from "axios"
import { sleep } from "@/utils"

export const http = axios.create({
    baseURL: 'http://localhost:8000/api/v1/',
})

http.interceptors.response.use(async (response) => {
    if (process.env.NODE_ENV === 'development') {
        await sleep()
    }
    return response
})
