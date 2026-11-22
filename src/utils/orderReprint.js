/**
 * Cantidades para REIMPRIMIR la comanda de un pedido (módulo Pedidos).
 *
 * Cómo guarda el backend las cantidades (sisrestaurantes):
 *  - Anular TODAS las unidades de una línea → la línea se borra (queda solo en order_canceleddetails).
 *  - Anular ALGUNAS → baja `quantity`; `initial_quantity` se queda con lo pedido.
 *  - Cobrar la mesa → `quantity` baja a 0 (por eso no sirve `quantity` sola).
 * Los anulados (order_canceleddetails) no apuntan a la línea, solo al producto.
 *
 * Regla: vigente = initial_quantity − unidades anuladas de ese producto,
 * y nunca menos que `quantity` (lo que aún falta cobrar ya está descontado de anulaciones).
 * Las anulaciones de productos sin línea viva son de líneas borradas: no se restan a nadie.
 */

const sameItem = (detail, canceled) => {
  if (canceled.product != null) return detail.product === canceled.product;
  // Combos/menús: el anulado no trae el id del set, solo su nombre
  const setName = detail.product_set?.name || detail.product_name;
  return detail.product == null && !!setName && setName === canceled.product_name;
};

export function detailsForReprint(order) {
  const details = Array.isArray(order?.order_details) ? order.order_details : [];
  const pending = (Array.isArray(order?.order_canceleddetails) ? order.order_canceleddetails : [])
    .map((c) => ({ ...c, left: Number(c.quantity || 0) }));

  return details
    .map((detail) => {
      const current = Number(detail.quantity || 0);
      let qty = Number(detail.initial_quantity ?? detail.quantity ?? 0);
      for (const canceled of pending) {
        if (qty <= current || canceled.left <= 0 || !sameItem(detail, canceled)) continue;
        const take = Math.min(qty - current, canceled.left);
        qty -= take;
        canceled.left -= take;
      }
      return { ...detail, initial_quantity: Math.max(qty, current) };
    })
    .filter((detail) => detail.initial_quantity > 0);
}
