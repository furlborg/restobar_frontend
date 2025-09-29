/**
 * Utility functions to expand menu items in sales and order data
 */

/**
 * Expands menus in sale data to show individual products
 * @param {Object} saleData - Parsed JSON sale data
 * @param {Array} orderDetails - Order details containing menu information
 * @returns {Object} Expanded sale data with individual menu products
 */
export function expandMenusInSaleData(saleData, orderDetails = []) {
  const expandedSaleData = { ...saleData };
  const expandedItems = [];
  
  // Iterar sobre todos los items de la venta
  saleData.items?.forEach((item, itemIndex) => {
    // Buscar si este item corresponde a un menú
    const menuDetail = orderDetails.find(detail => 
      detail.product_set && 
      (detail.product_set.name === item.descripcion || 
       detail.product_set.menu_name === item.descripcion ||
       // Fallback: si no hay coincidencia exacta, buscar por el precio del menú
       (detail.product_set.price && parseFloat(detail.product_set.price) === item.total_item))
    );
    
    if (menuDetail && menuDetail.product_set && menuDetail.product_set.items?.length > 0) {
      // Es un menú, expandir sus productos
      const menuName = menuDetail.product_set.menu_name || menuDetail.product_set.name || item.descripcion;
      expandedItems.push({
        ...item,
        descripcion: `${menuName} (Menú)`,
        isMenuHeader: true,
        originalIndex: itemIndex
      });
      
      // Agregar cada producto del menú
      menuDetail.product_set.items.forEach((menuItem, subIndex) => {
        if (menuItem.product && menuItem.quantity > 0) {
          expandedItems.push({
            cantidad: menuItem.quantity,
            descripcion: `  ↳ ${menuItem.product.name}`,
            precio_unitario: parseFloat(menuItem.product.prices) || 0,
            total_item: (parseFloat(menuItem.product.prices) || 0) * menuItem.quantity,
            isMenuProduct: true,
            parentMenu: menuName,
            menuItemIndex: subIndex,
            originalIndex: itemIndex
          });
        }
      });
    } else {
      // No es un menú, agregar normalmente
      expandedItems.push({
        ...item,
        originalIndex: itemIndex
      });
    }
  });
  
  expandedSaleData.items = expandedItems;
  return expandedSaleData;
}

/**
 * Expands order details to show individual products from menus
 * @param {Array} orderDetails - Array of order details
 * @returns {Array} Expanded order details with individual menu products
 */
export function expandOrderDetails(orderDetails = []) {
  const expanded = [];
  
  orderDetails.forEach((detail, detailIndex) => {
    if (detail.product_set && detail.product_set.items?.length > 0) {
      // Es un menú, agregar cabecera y productos
      const menuName = detail.product_set.menu_name || detail.product_set.name || 'Menú';
      expanded.push({
        ...detail,
        product_name: `${menuName} (Menú)`,
        price: parseFloat(detail.product_set.price) || 0,
        isMenuHeader: true,
        originalIndex: detailIndex
      });
      
      // Agregar cada producto del menú
      detail.product_set.items.forEach((item, itemIndex) => {
        if (item.product && item.quantity > 0) {
          expanded.push({
            quantity: item.quantity,
            product_name: `  ↳ ${item.product.name}`,
            price: parseFloat(item.product.prices) || 0,
            isMenuProduct: true,
            parentMenu: menuName,
            menuItemIndex: itemIndex,
            originalIndex: detailIndex
          });
        }
      });
    } else if (detail.product) {
      // No es un menú, agregar normalmente
      expanded.push({
        ...detail,
        originalIndex: detailIndex
      });
    }
  });
  
  return expanded;
}

/**
 * Calculates the correct total including menu prices
 * @param {Array} orderDetails - Array of order details
 * @returns {Number} Total amount
 */
export function calculateOrderTotal(orderDetails = []) {
  return orderDetails.reduce((acc, detail) => {
    if (detail.product_set && detail.product_set.price) {
      // Es un menú, usar el precio del menú
      return acc + (parseFloat(detail.product_set.price) * detail.quantity);
    } else if (detail.product && detail.price) {
      // Es un producto individual
      return acc + (detail.price * detail.quantity);
    }
    return acc;
  }, 0);
}