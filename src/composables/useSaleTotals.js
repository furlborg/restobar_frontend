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
    const menuSets = salePayload.value.sale_product_sets || [];
    
    // Calcular totales de productos regulares por afectación
    const taxed = details.filter(d => d.product_affectation === 10)
      .reduce((acc, d) => acc + ((Number(d.price_sale || 0) - Number(d.igv_tax || 0)) * Number(d.quantity || 0)), 0);
    
    const exempt = details.filter(d => d.product_affectation === 20)
      .reduce((acc, d) => acc + (Number(d.price_sale || 0) * Number(d.quantity || 0)), 0);
    
    const free = details.filter(d => d.product_affectation === 21)
      .reduce((acc, d) => acc + (Number(d.price_sale || 0) * Number(d.quantity || 0)), 0);
    
    const igv = details.reduce((acc, d) => 
      acc + (Number(d.igv_tax || 0) * Number(d.quantity || 0)), 0);
    
    const icbper = details.reduce((acc, d) => 
      acc + (Number(d.icbper || 0) * Number(d.quantity || 0)), 0);
    
    // AGREGADO: Sumar el total de combos/menús a OP. EXONERADAS
    // Los combos/menús no tienen afectación individual, se consideran exonerados por defecto
    const menuTotal = menuSets.reduce((acc, menu) => 
      acc + (Number(menu.price || 0) * Number(menu.quantity || 0)), 0);
    
    return {
      taxed: round2(taxed),
      exempt: round2(exempt + menuTotal), // ✅ Incluir combos/menús en exoneradas
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
