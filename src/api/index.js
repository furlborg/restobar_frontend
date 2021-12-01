import axios from "axios"
import {sleep} from "@/utils"

export const http = axios.create({
    baseURL: 'http://192.168.1.123:8000/',
})

http.interceptors.response.use(async (response) => {
    if (process.env.NODE_ENV === 'development') {
        await sleep()
    }
    return response
})
