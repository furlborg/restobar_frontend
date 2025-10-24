import { defineStore } from "pinia";
import { useSettingsStore } from "@/store/modules/settings";

export const useOrderStore = defineStore("order", {
    state: () => ({
        orderId: null,
        orders: []
    }),
    getters: {
        orderList(state) {
            const settingsStore = useSettingsStore();
            const icbperTax = parseFloat(settingsStore.businessSettings.sale?.icbper_tax || 0);

            const snapshot = state.orders.slice();
            const map = new Map();

            for (const item of snapshot) {
                const productId = item.product;
                const price = parseFloat(item.price || "0");
                const qty = Number(item.quantity || 0);
                const indications = Array.isArray(item.indication) && item.indication.length
                                    ? item.indication
                                    : [ { description: "", quick_indications: [] } ];

                // Si hay más indicaciones que cantidad, ajustamos proporcionalmente
                const baseQty = indications.length > 1 ? qty / indications.length : qty;

                for (const ind of indications) {
                    const desc = (ind.description || "").trim().toLowerCase();
                    const quick = Array.isArray(ind.quick_indications)
                                  ? ind.quick_indications.map((q) => q.trim().toLowerCase()).sort() // asegura que ["picante", "cremosa"] == ["cremosa", "picante"]
                                  .join(",")
                                  : "";

                    // 🔑 Clave compuesta por producto + descripción + quick_indications
                    const key = `${ productId }__${ desc || "no-desc" }__${ quick || "no-quick" }`;

                    if ( !map.has(key)) {
                        map.set(key, {
                            ...item,
                            quantity: baseQty,
                            subTotal: baseQty * price,
                            sub_total: baseQty * price,
                            sale_detail_total: baseQty * price,
                            icbper_amount: item.icbper ? baseQty * icbperTax : 0,
                            indication: desc || quick ? [ ind ] : []
                        });
                    } else {
                        const existing = map.get(key);

                        existing.quantity += baseQty;
                        existing.subTotal += baseQty * price;
                        existing.sub_total = existing.subTotal;
                        existing.sale_detail_total = existing.subTotal;
                        existing.icbper_amount += item.icbper ? baseQty * icbperTax : 0;

                        // Evita duplicar indicaciones idénticas
                        const exists = existing.indication.some((i) => {
                            const iDesc = (i.description || "").trim().toLowerCase();
                            const iQuick = Array.isArray(i.quick_indications)
                                           ? i.quick_indications.map((q) => q.trim().toLowerCase()).sort().join(",")
                                           : "";
                            return iDesc === desc && iQuick === quick;
                        });

                        if ( !exists) {
                            existing.indication.push(ind);
                        }
                    }
                }
            }

            const merged = Array.from(map.values());

            // 🔄 Evita recursión infinita comparando antes de mutar el array
            if (JSON.stringify(state.orders) !== JSON.stringify(merged)) {
                state.orders.splice(0, state.orders.length, ...merged);
            }

            return state.orders.filter(detail => detail.quantity > 0);
        },
        orderTotal(state) {
            return state.orders.reduce((acc, curVal) => {
                return (acc += curVal.price * curVal.quantity);
            }, 0);
        },
        orderToSale(state) {
            return state.orders.map((order) => ({
                product: order.product,
                product_name: order.product_name,
                price_sale: parseFloat(order.price).toFixed(2),
                quantity: Number(order.quantity),
                icbper: parseFloat(order.icbper_amount).toFixed(2),
                product_affectation: order.affectation,
                product_igv: order.igv_tax
            }));
        }
    },
    actions: {
        initializeStore() {
            return null;
        },
        addOrder(product) {
            const settingsStore = useSettingsStore();

            const indicationKey = product.indication && product.indication.length > 0 ? product.indication.map(i => i.description).join("|") : "";

            const existence = this.orders.find(order => {
                const orderKey = order.indication && order.indication.length > 0 ? order.indication.map(i => i.description).join("|") : "";
                return order.product === product.id && orderKey === indicationKey;
            });

            if (typeof existence !== "undefined") {
                existence.quantity++;
            } else {
                let order = {
                    product: product.id,
                    product_name: product.name,
                    price: product.prices,
                    quantity: 1,
                    indication: product.indication || [],
                    icbper: product.icbper,
                    product_affectation: product.affectation,
                    product_igv: !Number(product.igv_tax) ? settingsStore.businessSettings.sale.igv_tax : Number(product.igv_tax),
                    quick_indications: product.quick_indications
                };
                this.orders.push(order);
            }
        },
        makeKey(item) {
            const productId = item.product ?? "";
            const indications = Array.isArray(item.indication) ? item.indication : [];
            const desc = (indications[0]?.description || "").trim().toLowerCase();
            const quick = Array.isArray(indications[0]?.quick_indications)
                          ? indications[0].quick_indications.map(q => q.trim().toLowerCase()).sort().join(",")
                          : "";
            return `${productId}__${desc || "no-desc"}__${quick || "no-quick"}`;
        },

        addOrderItem(item) {
            if (!item.product) {
                console.warn("⚠️ addOrderItem: item sin 'product' válido", item);
                return;
            }

            // Normalizar cantidad según la acción
            const quantityToAdd = item.fromButton ? 1 : Number(item.quantity || 1);

            const key = this.makeKey(item);
            const existingIndex = this.orders.findIndex(o => this.makeKey(o) === key);

            if (existingIndex !== -1) {
                // Si ya existe el mismo producto + indicación, solo suma cantidad
                const existing = this.orders[existingIndex];
                existing.quantity += quantityToAdd;
                existing.subTotal = existing.quantity * parseFloat(existing.price || 0);
                existing.sub_total = existing.subTotal;
                existing.sale_detail_total = existing.subTotal;
                return;
            }

            // Buscar si existe un detalle del mismo producto con ID backend idéntico
            const sameProductWithBackendId = this.orders.find(o => {
                if (o.product !== item.product) return false;
                const oDesc = (o.indication?.[0]?.description || "").trim().toLowerCase();
                const iDesc = (item.indication?.[0]?.description || "").trim().toLowerCase();
                return oDesc === iDesc && typeof o.id === "number" && o.id > 0;
            });

            const backendId = item.fromBackend && sameProductWithBackendId
                              ? sameProductWithBackendId.id
                              : null;

            const newItem = {
                ...item,
                id: backendId,
                product: item.product,
                indication: Array.isArray(item.indication) ? [...item.indication] : [],
                quantity: quantityToAdd,
                price: parseFloat(item.price || 0),
                subTotal: parseFloat(item.price || 0) * quantityToAdd,
                sub_total: parseFloat(item.price || 0) * quantityToAdd,
                sale_detail_total: parseFloat(item.price || 0) * quantityToAdd,
            };

            this.orders.push(newItem);
        }
    }
});
