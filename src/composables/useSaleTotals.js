/**
 * Sale Totals Composable
 * 
 * Provides reactive calculations for sale totals including:
 * - Product lines and menu sets totals
 * - Tax breakdowns (IGV, ICBPER, exempt, free)
 * - Formatted display values
 * - Validation helpers
 */

import { computed } from 'vue';
import { useSaleStore } from '@/store/modules/sale';
import { round2 } from '@/utils/money';

export function useSaleTotals() {
  const saleStore = useSaleStore();
  
  // Core payload (reactive)
  const salePayload = computed(() => saleStore.salePayload);
  
  // Basic totals
  const totals = computed(() => saleStore.computeTotals());
  
  const productTotal = computed(() => totals.value.productTotal);
  const menuTotal = computed(() => totals.value.menuTotal);
  const grandTotal = computed(() => totals.value.grandTotal);
  
  // Tax breakdown for product lines only (menus don't have individual tax breakdown)
  const taxBreakdown = computed(() => {
    const details = salePayload.value.sale_details || [];
    
    const taxed = details.filter(d => d.product_affectation === 10)
      .reduce((acc, d) => acc + (Number(d.price_sale || 0) * Number(d.quantity || 0)), 0);
    
    const exempt = details.filter(d => d.product_affectation === 20)
      .reduce((acc, d) => acc + (Number(d.price_sale || 0) * Number(d.quantity || 0)), 0);
    
    const free = details.filter(d => d.product_affectation === 21)
      .reduce((acc, d) => acc + (Number(d.price_sale || 0) * Number(d.quantity || 0)), 0);
    
    const igv = details.reduce((acc, d) => 
      acc + (Number(d.igv_tax || 0) * Number(d.quantity || 0)), 0);
    
    const icbper = details.reduce((acc, d) => 
      acc + (Number(d.icbper || 0) * Number(d.quantity || 0)), 0);
    
    return {
      taxed: round2(taxed),
      exempt: round2(exempt), 
      free: round2(free),
      igv: round2(igv),
      icbper: round2(icbper)
    };
  });
  
  // Summary for display
  const summary = computed(() => ({
    subtotal: round2(productTotal.value + menuTotal.value - taxBreakdown.value.igv),
    igv: taxBreakdown.value.igv,
    icbper: taxBreakdown.value.icbper,
    total: grandTotal.value
  }));
  
  // Item counts
  const itemCounts = computed(() => {
    const payload = salePayload.value;
    return {
      productCount: (payload.sale_details || []).length,
      menuCount: (payload.sale_product_sets || []).length,
      totalItems: (payload.sale_details || []).length + (payload.sale_product_sets || []).length
    };
  });
  
  // Validation helpers
  const hasItems = computed(() => itemCounts.value.totalItems > 0);
  const hasMenus = computed(() => itemCounts.value.menuCount > 0);
  const hasProducts = computed(() => itemCounts.value.productCount > 0);
  
  // Format helpers
  const formatCurrency = (value) => `S/. ${Number(value || 0).toFixed(2)}`;
  
  const formattedTotals = computed(() => ({
    productTotal: formatCurrency(productTotal.value),
    menuTotal: formatCurrency(menuTotal.value),
    grandTotal: formatCurrency(grandTotal.value),
    igv: formatCurrency(taxBreakdown.value.igv),
    icbper: formatCurrency(taxBreakdown.value.icbper)
  }));
  
  // Payment summary helper
  const getPaymentSummary = () => {
    const { taxed, exempt, free, igv, icbper } = taxBreakdown.value;
    return {
      subtotal: round2(productTotal.value + menuTotal.value - igv),
      igv_tax: igv,
      icbper_tax: icbper,
      total_amount: grandTotal.value,
      tax_breakdown: { taxed, exempt, free }
    };
  };
  
  // Validation
  const validateSaleData = () => {
    const errors = [];
    
    if (!hasItems.value) {
      errors.push('No hay productos ni menús seleccionados');
    }
    
    if (grandTotal.value <= 0) {
      errors.push('El total debe ser mayor que cero');
    }
    
    const payload = salePayload.value;
    
    // Validate product details
    (payload.sale_details || []).forEach((detail, index) => {
      if (!detail.product || !detail.quantity || detail.quantity <= 0) {
        errors.push(`Producto ${index + 1}: cantidad inválida`);
      }
      if (!detail.price_sale || detail.price_sale < 0) {
        errors.push(`Producto ${index + 1}: precio inválido`);
      }
    });
    
    // Validate menu sets
    (payload.sale_product_sets || []).forEach((menu, index) => {
      if (!menu.menu_id || !menu.quantity || menu.quantity <= 0) {
        errors.push(`Menú ${index + 1}: datos inválidos`);
      }
      if (!menu.price || menu.price < 0) {
        errors.push(`Menú ${index + 1}: precio inválido`);
      }
    });
    
    return { isValid: errors.length === 0, errors };
  };

  return {
    // Core data
    salePayload,
    
    // Totals
    productTotal,
    menuTotal, 
    grandTotal,
    taxBreakdown,
    summary,
    
    // Counts
    itemCounts,
    hasItems,
    hasMenus,
    hasProducts,
    
    // Formatted
    formattedTotals,
    formatCurrency,
    
    // Helpers
    getPaymentSummary,
    validateSaleData
  };
}
/*
import { computed } from 'vue';
import { useSaleStore } from '@/store/modules/sale';
import { useOrderStore } from '@/store/modules/order';
import { round2 } from '@/utils/money';

export function useSaleTotals() {
  const saleStore = useSaleStore();
  const orderStore = useOrderStore();

  // Core payload and totals
  const salePayload = computed(() => saleStore.salePayload);
  const totals = computed(() => saleStore.computeTotals());

  // Individual total components
  const productTotal = computed(() => totals.value.productTotal);
  const menuTotal = computed(() => totals.value.menuTotal);
  const grandTotal = computed(() => totals.value.grandTotal);

  // Tax calculations with proper breakdown
  const taxBreakdown = computed(() => {
    const { sale_details = [] } = salePayload.value;
    
    let opGravada = 0;    // Taxed operations (affectation 10)
    let opExonerada = 0;  // Exempt operations (affectation 20)
    let opGratuita = 0;   // Free operations (affectation 21)
    let igvTotal = 0;     // Total IGV tax
    let icbperTotal = 0;  // Total ICBPER tax

    sale_details.forEach(detail => {
      const lineTotal = round2(detail.price_sale * detail.quantity);
      const igvAmount = round2(detail.igv_tax * detail.quantity);
      const icbperAmount = round2(detail.icbper * detail.quantity);

      switch (detail.product_affectation) {
        case 10: // Taxed
          opGravada += lineTotal;
          igvTotal += igvAmount;
          break;
        case 20: // Exempt
          opExonerada += lineTotal;
          break;
        case 21: // Free
          opGratuita += lineTotal;
          break;
      }
      
      icbperTotal += icbperAmount;
    });

    return {
      opGravada: round2(opGravada),
      opExonerada: round2(opExonerada),
      opGratuita: round2(opGratuita),
      igvTotal: round2(igvTotal),
      icbperTotal: round2(icbperTotal),
      subTotal: round2(productTotal.value + menuTotal.value - igvTotal) // Include menus in subtotal
    };
  });

  // Formatted values for display
  const formattedTotals = computed(() => ({
    productTotal: `S/. ${productTotal.value.toFixed(2)}`,
    menuTotal: `S/. ${menuTotal.value.toFixed(2)}`,
    grandTotal: `S/. ${grandTotal.value.toFixed(2)}`,
    subTotal: `S/. ${taxBreakdown.value.subTotal.toFixed(2)}`,
    opGravada: `S/. ${taxBreakdown.value.opGravada.toFixed(2)}`,
    opExonerada: `S/. ${taxBreakdown.value.opExonerada.toFixed(2)}`,
    opGratuita: `S/. ${taxBreakdown.value.opGratuita.toFixed(2)}`,
    igvTotal: `S/. ${taxBreakdown.value.igvTotal.toFixed(2)}`,
    icbperTotal: `S/. ${taxBreakdown.value.icbperTotal.toFixed(2)}`
  }));

  // Validation helpers
  const hasItems = computed(() => orderStore.orderList.length > 0);
  const hasProducts = computed(() => orderStore.productLines.length > 0);
  const hasMenus = computed(() => orderStore.menuSets.length > 0);
  
  const isEmpty = computed(() => !hasItems.value);
  const isValidForSale = computed(() => hasItems.value && grandTotal.value > 0);

  // Item counts
  const itemCounts = computed(() => ({
    total: orderStore.orderList.length,
    products: orderStore.productLines.length,
    menus: orderStore.menuSets.length,
    totalQuantity: orderStore.orderList.reduce((acc, item) => acc + Number(item.quantity || 0), 0)
  }));

  // Payment calculation helper
  const getPaymentSummary = (givenAmount = 0, discount = 0) => {
    const finalAmount = Math.max(0, grandTotal.value - discount);
    const change = Math.max(0, givenAmount - finalAmount);
    
    return {
      totalAmount: round2(grandTotal.value),
      discount: round2(discount),
      finalAmount: round2(finalAmount),
      givenAmount: round2(givenAmount),
      change: round2(change),
      isPaid: givenAmount >= finalAmount,
      isOverpaid: givenAmount > finalAmount
    };
  };

  // Validation for sale data
  const validateSaleData = (saleData = {}) => {
    const errors = [];
    
    if (!hasItems.value) {
      errors.push('No hay items en la orden');
    }
    
    if (grandTotal.value <= 0) {
      errors.push('El total debe ser mayor a 0');
    }
    
    if (saleData.payment_condition === 1 && (!saleData.given_amount || saleData.given_amount < grandTotal.value)) {
      errors.push('El monto pagado es insuficiente');
    }
    
    return { isValid: errors.length === 0, errors };
  };

  return {
    // Core data
    salePayload,
    
    // Totals
    productTotal,
    menuTotal,
    grandTotal,
    taxBreakdown,
    
    // Formatted
    formattedTotals,
    
    // Validation
    hasItems,
    hasProducts,
    hasMenus,
    isEmpty,
    isValidForSale,
    
    // Counts
    itemCounts,
    
    // Helpers
    getPaymentSummary,
    validateSaleData
  };
}*/


/* export function useSaleTotals() {
  const saleStore = useSaleStore();
  
  // Core payload (reactive)
  const salePayload = computed(() => saleStore.salePayload);
  
  // Basic totals
  const totals = computed(() => saleStore.computeTotals());
  
  const productTotal = computed(() => totals.value.productTotal);
  const menuTotal = computed(() => totals.value.menuTotal);
  const grandTotal = computed(() => totals.value.grandTotal);
  
  // Tax breakdown for product lines only (menus don't have individual tax breakdown)
  const taxBreakdown = computed(() => {
    const details = salePayload.value.sale_details || [];
    
    const taxed = details.filter(d => d.product_affectation === 10)
      .reduce((acc, d) => acc + (Number(d.price_sale || 0) * Number(d.quantity || 0)), 0);
    
    const exempt = details.filter(d => d.product_affectation === 20)
      .reduce((acc, d) => acc + (Number(d.price_sale || 0) * Number(d.quantity || 0)), 0);
    
    const free = details.filter(d => d.product_affectation === 21)
      .reduce((acc, d) => acc + (Number(d.price_sale || 0) * Number(d.quantity || 0)), 0);
    
    const igv = details.reduce((acc, d) => 
      acc + (Number(d.igv_tax || 0) * Number(d.quantity || 0)), 0);
    
    const icbper = details.reduce((acc, d) => 
      acc + (Number(d.icbper || 0) * Number(d.quantity || 0)), 0);
    
    return {
      taxed: round2(taxed),
      exempt: round2(exempt), 
      free: round2(free),
      igv: round2(igv),
      icbper: round2(icbper)
    };
  });
  
  // Summary for display
  const summary = computed(() => ({
    subtotal: round2(productTotal.value + menuTotal.value - taxBreakdown.value.igv),
    igv: taxBreakdown.value.igv,
    icbper: taxBreakdown.value.icbper,
    total: grandTotal.value
  }));
  
  // Item counts
  const itemCounts = computed(() => {
    const payload = salePayload.value;
    return {
      productCount: (payload.sale_details || []).length,
      menuCount: (payload.sale_product_sets || []).length,
      totalItems: (payload.sale_details || []).length + (payload.sale_product_sets || []).length
    };
  });
  
  // Validation helpers
  const hasItems = computed(() => itemCounts.value.totalItems > 0);
  const hasMenus = computed(() => itemCounts.value.menuCount > 0);
  const hasProducts = computed(() => itemCounts.value.productCount > 0);
  
  // Format helpers
  const formatCurrency = (value) => `S/. ${Number(value || 0).toFixed(2)}`;
  
  const formattedTotals = computed(() => ({
    productTotal: formatCurrency(productTotal.value),
    menuTotal: formatCurrency(menuTotal.value),
    grandTotal: formatCurrency(grandTotal.value),
    igv: formatCurrency(taxBreakdown.value.igv),
    icbper: formatCurrency(taxBreakdown.value.icbper)
  }));
  
  return {
    // Core data
    salePayload,
    
    // Totals
    productTotal,
    menuTotal, 
    grandTotal,
    taxBreakdown,
    summary,
    
    // Counts
    itemCounts,
    hasItems,
    hasMenus,
    hasProducts,
    
    // Formatted
    formattedTotals,
    formatCurrency
  };
} */