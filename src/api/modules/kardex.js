import { http } from "@/api"

export async function getSuplieKardex(search) {
    return await http.get(`supliekardex/${search}`)
}