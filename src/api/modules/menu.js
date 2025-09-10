

import { http } from "@/api";

// -----------------------------
// MENUS
// -----------------------------
export async function getMenus({ search, active, page = 1, page_size = 20 } = {}) {
  const params = { page, page_size };
  if (search) params.search = search;
  if (active !== undefined && active !== null) params.active = active;
  return await http.get("menus/", { params });
}

export async function retrieveMenu(id) {
  return await http.get(`menus/${id}/`);
}

export async function createMenu(menu) {
  // menu: { name, price, active }
  return await http.post("menus/", {
    name: (menu.name || "").toUpperCase(),
    price: menu.price ?? 0,
    active: !!menu.active,
  });
}

export async function updateMenu(id, menu) {
  return await http.put(`menus/${id}/`, {
    name: (menu.name || "").toUpperCase(),
    price: menu.price ?? 0,
    active: !!menu.active,
  });
}

export async function deleteMenu(id) {
  // Si el backend implementa soft-delete por DELETE
  return await http.delete(`menus/${id}/`);
}

// -----------------------------
// PHASES (FaseMenu)
// -----------------------------
export async function getMenuPhases(menuId) {
  // ViewSet action: /api/menus/{id}/phases/
  return await http.get(`menus/${menuId}/phases/`);
}

export async function createPhase(phase) {
  // phase: { name, menu, active }
  return await http.post("phases/", {
    name: (phase.name || "").toUpperCase(),
    menu: phase.menu,
    active: phase.active ?? true,
  });
}

export async function updatePhase(id, phase) {
  return await http.put(`phases/${id}/`, {
    name: (phase.name || "").toUpperCase(),
    menu: phase.menu,
    active: phase.active ?? true,
  });
}

export async function deletePhase(id) {
  return await http.delete(`phases/${id}/`);
}

// -----------------------------
// PRODUCT-PHASE (ProductPhase)
// -----------------------------
export async function getProductPhases({ menu, phase } = {}) {
  const params = {};
  if (menu) params.menu = menu;
  if (phase) params.phase = phase;
  return await http.get("product-phases/", { params });
}

export async function getMenuProductPhases(menuId, { phase } = {}) {
  // ViewSet action: /api/menus/{id}/product-phases/?phase=
  const params = {};
  if (phase) params.phase = phase;
  return await http.get(`menus/${menuId}/product-phases/`, { params });
}

export async function createProductPhase(pp) {
  // pp: { product, phase, stock }
  return await http.post("product-phases/", {
    product: pp.product,
    phase: pp.phase,
    stock: pp.stock ?? 0,
  });
}

export async function updateProductPhase(id, pp) {
  return await http.put(`product-phases/${id}/`, {
    product: pp.product,
    phase: pp.phase,
    stock: pp.stock ?? 0,
  });
}

export async function deleteProductPhase(id) {
  return await http.delete(`product-phases/${id}/`);
}

// -----------------------------
// WEEKLY AVAILABILITY TEMPLATE (ProductPhaseAvailableDay)
// -----------------------------
export async function getProductPhaseAvailableDays({ menu, phase } = {}) {
  const params = {};
  if (menu) params.menu = menu;
  if (phase) params.phase = phase;
  return await http.get("product-phase-available-days/", { params });
}

export async function createProductPhaseAvailableDay(payload) {
  // payload: { product_phase, day }
  return await http.post("product-phase-available-days/", payload);
}

export async function updateProductPhaseAvailableDay(id, payload) {
  return await http.put(`product-phase-available-days/${id}/`, payload);
}

export async function deleteProductPhaseAvailableDay(id) {
  return await http.delete(`product-phase-available-days/${id}/`);
}

// -----------------------------
// SCHEDULE BY DATE (MenuScheduledDay & Items)
// -----------------------------
export async function getMenuScheduleByDate(menuId, date) {
  // /api/menus/{id}/schedule/?date=YYYY-MM-DD
  return await http.get(`menus/${menuId}/schedule/`, { params: { date } });
}

export async function applyMenuSchedule(menuId, { date, active = true, items = [] }) {
  // POST /api/menus/{id}/schedule/apply/
  // items: [{ product_phase, available, stock_override }]
  return await http.post(`menus/${menuId}/schedule/apply/`, {
    date,
    active,
    items,
  });
}

export async function getScheduledDays({ menu, date, page = 1, page_size = 50 } = {}) {
  const params = { page, page_size };
  if (menu) params.menu = menu;
  if (date) params.date = date;
  return await http.get("menu-scheduled-days/", { params });
}

export async function createScheduledDay(payload) {
  // payload: { menu, date, active }
  return await http.post("menu-scheduled-days/", payload);
}

export async function updateScheduledDay(id, payload) {
  return await http.put(`menu-scheduled-days/${id}/`, payload);
}

export async function deleteScheduledDay(id) {
  return await http.delete(`menu-scheduled-days/${id}/`);
}

export async function getScheduledItems({ scheduled_day, menu } = {}) {
  const params = {};
  if (scheduled_day) params.scheduled_day = scheduled_day;
  if (menu) params.menu = menu;
  return await http.get("menu-scheduled-items/", { params });
}

export async function createScheduledItem(payload) {
  // payload: { scheduled_day, product_phase, available, stock_override }
  return await http.post("menu-scheduled-items/", payload);
}

export async function updateScheduledItem(id, payload) {
  return await http.put(`menu-scheduled-items/${id}/`, payload);
}

export async function deleteScheduledItem(id) {
  return await http.delete(`menu-scheduled-items/${id}/`);
}

export async function getMenuScheduleWeek(menuId, startDate) {
  return await http.get(`menus/${menuId}/schedule/week/`, { params: { start: startDate } })
}

// Guardar programación en bulk
export async function saveMenuScheduleBulk(menuId, days) {
  return await http.post(`menus/${menuId}/schedule/bulk-apply/`, { days })
}

export async function getMenuWeeklyAvailability(menuId) {
  return await http.get(`menus/${menuId}/weekly-availability/`)
}

export async function saveMenuWeeklyAvailability(menuId, items) {
  return await http.post(`menus/${menuId}/weekly-availability/bulk-apply/`, { items })
}

// -----------------------------
// PROGRAMATION (MenuProgramation)
// -----------------------------
export async function getMenuProgramation(menuId) {
  // GET /api/menus/{id}/programation/
  return await http.get(`menus/${menuId}/programation/`);
}

export async function saveMenuProgramation(menuId, schedule) {
  // POST /api/menus/{id}/programation/
  // schedule: [{ id, product_name, phase_id, days: [] }]
  return await http.post(`menus/${menuId}/programation/`, { items: schedule });
}