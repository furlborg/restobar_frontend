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
      // Es un menú o combo, expandir sus productos
      const isCombo = menuDetail.product_set.set_type === 'COMBO';
      const typeSuffix = isCombo ? '(Combo)' : '(Menú)';
      const menuName = menuDetail.product_set.menu_name || menuDetail.product_set.name || item.descripcion;
      expandedItems.push({
        ...item,
        descripcion: `${menuName} ${typeSuffix}`,
        isMenuHeader: true,
        originalIndex: itemIndex
      });
      
      // Agregar cada producto del menú/combo
      menuDetail.product_set.items.forEach((menuItem, subIndex) => {
        const prod = menuItem.product || menuItem.combo_product?.product;
        const prodName = prod?.name || menuItem.product_name || 'Producto';
        const qty = parseFloat(menuItem.quantity) || 1;
        if (qty > 0) {
          expandedItems.push({
            cantidad: qty,
            descripcion: `  ↳ ${prodName}`,
            precio_unitario: parseFloat(prod?.prices) || 0,
            total_item: (parseFloat(prod?.prices) || 0) * qty,
            isMenuProduct: true,
            parentMenu: menuName,
            menuItemIndex: subIndex,
            originalIndex: itemIndex
          });
        }
      });
    } else {
      // No es un menú/combo, agregar normalmente
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
 * Expands order details to show individual products from menus/combos
 * @param {Array} orderDetails - Array of order details
 * @returns {Array} Expanded order details with individual menu products
 */
export function expandOrderDetails(orderDetails = []) {
  const expanded = [];
  
  orderDetails.forEach((detail, detailIndex) => {
    if (detail.product_set && detail.product_set.items?.length > 0) {
      // Es un menú o combo, agregar cabecera y productos
      const isCombo = detail.product_set.set_type === 'COMBO';
      const typeSuffix = isCombo ? '(Combo)' : '(Menú)';
      const menuName = detail.product_set.menu_name || detail.product_set.name || (isCombo ? 'Combo' : 'Menú');
      expanded.push({
        ...detail,
        product_name: `${menuName} ${typeSuffix}`,
        price: parseFloat(detail.product_set.price || detail.price) || 0,
        isMenuHeader: true,
        originalIndex: detailIndex
      });
      
      // Agregar cada producto del menú/combo
      detail.product_set.items.forEach((item, itemIndex) => {
        const prod = item.product || item.combo_product?.product;
        const prodName = prod?.name || item.product_name || 'Producto';
        const qty = parseFloat(item.quantity) || 1;
        if (qty > 0) {
          expanded.push({
            quantity: qty,
            product_name: `  ↳ ${prodName}`,
            price: parseFloat(prod?.prices) || 0,
            isMenuProduct: true,
            parentMenu: menuName,
            menuItemIndex: itemIndex,
            originalIndex: detailIndex
          });
        }
      });
    } else if (detail.product || detail.product_name) {
      // No es un menú/combo, agregar normalmente
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