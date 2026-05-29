const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const controlsStock = (item) =>
  item?.control_stock === true ||
  item?.control_stock === 1 ||
  item?.control_stock === "true";

const addLine = (accumulator, line) => {
  if (!controlsStock(line)) return;

  const productId = line.product ?? line.product_id ?? line.id;
  if (!productId) return;

  const current = accumulator.get(productId) || {
    productId,
    productName: line.product_name ?? line.name ?? "Producto",
    requested: 0,
    available: toNumber(line.stock),
  };

  current.requested += toNumber(line.quantity);
  current.available = toNumber(line.stock);
  accumulator.set(productId, current);
};

export const getInsufficientStockItems = (orders = []) => {
  const products = new Map();

  orders.forEach((order) => {
    if (order?.from_menu || order?.from_combo) {
      (order.items || []).forEach((item) => {
        addLine(products, {
          ...item,
          quantity: toNumber(item.quantity) * toNumber(order.quantity, 1),
        });
      });
      return;
    }

    addLine(products, order);
  });

  return Array.from(products.values()).filter(
    (item) => item.requested > item.available,
  );
};

