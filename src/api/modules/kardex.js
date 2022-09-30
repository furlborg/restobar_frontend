import { http } from "@/api";

export async function getSuplieKardex(search) {
  return await http.get(`kardexsuplie/${search}`);
}

export async function getProductKardex(search) {
  return await http.get(`kardexproduct/${search}`);
}

export async function listKardexBy(list) {
  return await http.get(`${list}-kardex/`);
}

export async function listKardexByPage(list, search, page, pageSize) {
  if (search) {
    return await http.get(`${list}-kardex/`, {
      params: {
        search: search,
        page: page,
        page_size: pageSize,
      },
    });
  } else {
    return await http.get(`${list}-kardex/`, {
      params: {
        page: page,
        page_size: pageSize,
      },
    });
  }
}

export async function updateKardexBy(list, id, data) {
  return await http.put(`${list}-kardex/${id}/`, { ...data });
}
