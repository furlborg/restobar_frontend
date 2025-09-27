/**
 * Sale Payload Assembler
 * 
 * Centralizes the construction of sale payloads for different contexts:
 * - Direct sales (createSale)
 * - Table orders (createTableOrder, updateTableOrder)
 * - Takeaway orders (takeAwayOrder)
 * 
 * Handles both product lines and menu sets with consistent structure.
 */

import { round2 } from '@/utils/money';

/**
 * Builds a unified sale payload from order store data
 * @param {Array} orders - Raw orders array from order store (mixed products + menus)
 * @param {Object} options - Additional options { includeZeroQty, transformItems }
 * @returns {Object} { sale_details: [], sale_product_sets: [] }
 */
export function buildSalePayload(orders = [], options = {}) {
  const { includeZeroQty = false } = options;
  
  const sale_details = [];
  const sale_product_sets = [];

  orders.forEach(order => {
    if (order.from_menu) {
      // Menu set
      const productSet = {
        name: order.name || 'Menu',
        price: Number(order.price || 0),
        quantity: Number(order.quantity || 1),
        items: (order.items || []).map(item => ({
          product_id: item.product_id,
          product_phase_id: item.product_phase_id,
          product_name: item.product_name,
          phase_name: item.phase_name,
          quantity: Number(item.quantity || 1)
        }))
      };
      
      // Add optional fields if present
      if (order.id) productSet.id = order.id;
      if (order.product_set_id) productSet.product_set_id = order.product_set_id;
      if (order.menu_id) productSet.menu_id = order.menu_id;
      
      sale_product_sets.push(productSet);
    } else {
      // Regular product line
      const quantity = Number(order.quantity || 0);
      if (!includeZeroQty && quantity <= 0) return;
      
      const detail = {
        product: order.product,
        product_name: order.product_name,
        product_affectation: order.product_affectation,
        product_igv: order.product_igv,
        price_base: Number(order.price || 0),
        igv_tax: 0, // Will be computed by tax engine
        discount: Number(order.discount || 0),
        price_sale: Number(order.price || 0),
        quantity: quantity,
        icbper: Number(order.icbper_amount || 0),
        customer: order.customer || null
      };
      
      // Add optional fields
      if (order.id) detail.id = order.id;
      if (order.indication) detail.indication = order.indication;
      if (order.quick_indications) detail.quick_indications = order.quick_indications;
      
      sale_details.push(detail);
    }
  });

  return { sale_details, sale_product_sets };
}

/**
 * Builds table order payload (for createTableOrder/updateTableOrder)
 * @param {Array} orders - Orders from store
 * @param {Object} context - { tillId, orderType, askFor, user }
 * @returns {Object} { order_details: [], product_sets: [] }
 */
export function buildTableOrderPayload(orders = [], context = {}) {
  const { tillId, orderType = 'M', askFor, user } = context;
  
  const order_details = [];
  const product_sets = [];

  orders.forEach(order => {
    if (order.from_menu) {
      const productSet = {
        name: 'MENU', // Fixed name for compatibility
        menu_name: order.name,
        price: Number(order.price || 0),
        quantity: Number(order.quantity || 1),
        items: (order.items || []).map(item => ({
          product_phase_id: item.product_phase_id,
          product_id: item.product_id,
          quantity: Number(item.quantity || 1),
          indication: item.indication || ""
        }))
      };
      
      // Add IDs for updates
      if (order.id) productSet.order_detail_id = order.id;
      if (order.product_set_id) productSet.id = order.product_set_id;
      if (order.menu_id) productSet.menu_id = order.menu_id;
      
      product_sets.push(productSet);
    } else {
      const detail = {
        product: order.product,
        indication: order.indication || [],
        quantity: Number(order.quantity || 0),
        customer: order.customer || null
      };
      
      if (order.id) detail.id = order.id;
      
      order_details.push(detail);
    }
  });

  return {
    till: tillId,
    order_type: orderType,
    order_details,
    product_sets,
    ask_for: askFor,
    user: user || null
  };
}

/**
 * Builds takeaway order payload
 * @param {Array} orders - Orders from store
 * @param {Object} saleData - Sale data object
 * @param {Object} context - { tillId, user, userRole, businessSettings }
 * @returns {Object} { order: {}, sale: {} }
 */
export function buildTakeawayOrderPayload(orders = [], saleData = {}, context = {}) {
  const { tillId, user, userRole, businessSettings } = context;
  
  const { sale_details, sale_product_sets } = buildSalePayload(orders, { includeZeroQty: false });
  
  // Build order_details for the order part
  const order_details = sale_details.map(detail => ({
    product: detail.product,
    quantity: detail.quantity,
    initial_quantity: detail.quantity,
    indication: detail.indication || [],
    quick_indications: detail.quick_indications || []
  }));

  const order = {
    till: tillId,
    order_details,
    product_sets: sale_product_sets,
    order_type: saleData.delivery_info ? "D" : "P",
    delivery_info: saleData.delivery_info,
    ask_for: saleData.ask_for,
    user: user || null,
    status: determineOrderStatus(saleData, { userRole, businessSettings })
  };

  const sale = {
    ...saleData,
    sale_details,
    product_sets: sale_product_sets,
    till: tillId
  };

  return { order, sale };
}

function determineOrderStatus(saleData, context) {
  const { userRole, businessSettings } = context;
  
  if (saleData.delivery_info || userRole === "MOZO") return "1";
  if (businessSettings?.order?.pending_takeaway) return "1";
  return "2";
}

/**
 * Computes totals from sale payload
 * @param {Object} payload - { sale_details, sale_product_sets }
 * @returns {Object} { productTotal, menuTotal, grandTotal }
 */
export function computePayloadTotals(payload) {
  const { sale_details = [], sale_product_sets = [] } = payload;
  
  const productTotal = sale_details.reduce((acc, detail) => 
    acc + (Number(detail.price_sale || 0) * Number(detail.quantity || 0)), 0
  );
  
  const menuTotal = sale_product_sets.reduce((acc, set) => 
    acc + (Number(set.price || 0) * Number(set.quantity || 0)), 0
  );
  
  return {
    productTotal: round2(productTotal),
    menuTotal: round2(menuTotal),
    grandTotal: round2(productTotal + menuTotal)
  };
}