<template>
    <div id="DefaultTicket">
        <div class="ticket">
            <div class="ticket-header">
                <div class="ticket-header-title" :style="{
                    fontSize: `${settingsStore.business_settings.printer.header_font_size}px`,
                    textAlign:
                        settingsStore.business_settings.printer.kitchen_ticket_format ===
                            3
                            ? 'right'
                            : 'center',
                }">
                    {{ info.table || (!info.delivery_info ? "PARA LLEVAR" : "DELIVERY") }}
                </div>
                <div v-if="
                    settingsStore.business_settings.printer.kitchen_ticket_format !== 3
                " class="ticket-header-subtitle" :style="{
            fontSize: `${settingsStore.business_settings.printer.sub_header_font_size}px`,
        }">
                    ORDEN #{{ info.id }}
                </div>
                <div v-if="isUpdate" class="ticket-header-subtitle" :style="{
                    fontSize: `${settingsStore.business_settings.printer.sub_header_font_size}px`,
                }">
                    ACTUALIZACIÓN
                </div>
            </div>
            <div class="ticket-body" :style="{
                fontSize: `${settingsStore.business_settings.printer.body_font_size}px`,
            }">
                <div class="ticket-body-info" :style="{
                    fontSize: `${settingsStore.business_settings.printer.body_font_size + 1
                        }px`,
                }">
                    <template v-if="
                        settingsStore.business_settings.printer.info_location === 'header'
                    ">
                        <div>{{ info.created }}</div>
                        <div>{{ info.username }}</div>
                    </template>
                    <div v-if="info.order_type !== 'M' && data.ask_for" key="ask_for">
                        REFERENCIA: {{ data.ask_for }}
                    </div>
                </div>
                <template v-if="groupedDetails.length">
                    <template v-for="group in groupedDetails" :key="group.key">
                        <div v-if="group.customerName" class="ticket-customer">
                        {{ settingsStore.business_settings?.order?.order_by_customer ? `CLIENTE: ${group.customerName}` : group.customerName }}
                        </div>

                        <!-- Formato de tabla -->
                        <template v-if="settingsStore.business_settings.printer.kitchen_ticket_format === 4">
                            <table style="width: 100%">
                                <thead>
                                <tr>
                                    <th width="20%">CANT</th>
                                    <th :width="!settingsStore.business_settings.printer.show_product_price ? '80%' : '60%'">PRODUCTO</th>
                                    <th v-if="settingsStore.business_settings.printer.show_product_price" width="20%">PRC</th>
                                </tr>
                                </thead>
                                <tbody>
                                <tr v-for="detail in group.items" :key="detail.id">
                                    <td align="center">{{ !!isUpdate ? detail.quantity : detail.initial_quantity }}</td>
                                    <td>
                                    {{ getPrefix(detail.product_category, detail.product_set) }}
                                    {{ detail.product_name || detail.product_set?.name }}
                                    {{ generateIndication(detail.indication) }}
                                    
                                    <!-- Mostrar productos del menú/combo si existe product_set -->
                                    <div v-if="detail.product_set && detail.product_set.items" class="menu-items-table">
                                        <div v-for="item in detail.product_set.items" :key="item.id" class="menu-item-table">
                                            • {{ item.quantity }}x 
                                            {{ item.product_phase?.product_name || item.product?.name || 'Producto' }}
                                            <span v-if="item.product_phase?.phase_name">({{ item.product_phase.phase_name }})</span>
                                        </div>
                                    </div>
                                    </td>
                                    <td v-if="settingsStore.business_settings.printer.show_product_price">
                                    {{ (detail.price || detail.product_set?.price || 0).toFixed(2) }}
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </template>

                        <template v-else>
                            <template v-for="detail in group.items" :key="detail.id">
                                <div class="ticket-body-item">
                                <div>
                                    {{ getPrefix(detail.product_category, detail.product_set) }}
                                    {{ settingsStore.business_settings.printer.kitchen_ticket_format !== 1 ? `${!!isUpdate ? detail.quantity : detail.initial_quantity} x ` : '' }}{{ detail.product_name || detail.product_set?.name }}
                                </div>
                                <div v-if="settingsStore.business_settings.printer.kitchen_ticket_format === 1">
                                    CANT: {{ !!isUpdate ? detail.quantity : detail.initial_quantity }}
                                </div>
                                
                                <!-- Mostrar productos del menú/combo si existe product_set -->
                                <div v-if="detail.product_set && detail.product_set.items" class="menu-items" :style="{ fontSize: `${settingsStore.business_settings.printer.body_font_size - 1}px` }">
                                    <template v-for="item in detail.product_set.items" :key="item.id">
                                        <div class="menu-item">
                                            • {{ item.quantity }}x 
                                            {{ item.product_phase?.product_name || item.product?.name || 'Producto' }}
                                            <span v-if="item.product_phase?.phase_name" class="phase-name">({{ item.product_phase.phase_name }})</span>
                                        </div>
                                    </template>
                                </div>
                                
                                <div class="indication" :style="{ fontSize: `${settingsStore.business_settings.printer.body_font_size - 1}px` }">
                                    <template v-if="!!detail.product_description && settingsStore.business_settings.printer.kitchen_ticket_format !== 3">
                                    <div v-for="desc in detail.product_description.split(',')" :key="desc">*{{ desc }}</div>
                                    </template>
                                    <template v-for="(indication, index) in detail.indication" :key="index">
                                    <div class="indication-item" v-if="!!indication.description">
                                        - {{ !indication.takeAway ? indication.description : indication.description + ' [LLEVAR]' }}
                                    </div>
                                    </template>
                                    <div v-if="info.order_type === 'M' && detail.indication.some((ind) => ind.takeAway)" class="indication-extra">
                                    PARA LLEVARrr: {{ indicationTakeAways(detail.indication) }}
                                    </div>
                                </div>
                                </div>
                            </template>
                        </template>
                    </template>
                </template>
                <template v-if="
                    settingsStore.business_settings.printer.manage_fittings &&
                    !place.is_main &&
                    fitting_info.order_details.length
                ">
                    <template v-if="
                        settingsStore.business_settings.printer.kitchen_ticket_format ===
                        4
                    ">
                        <table style="width: 100%">
                            <thead>
                                <tr>
                                    <th width="20%">CANT.</th>
                                    <th width="80%">GUARNICIÓN</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="detail in fitting_info.order_details" :key="`fitting-${detail.id}`">
                                    <td align="center">
                                        {{ !!isUpdate ? detail.quantity : detail.initial_quantity }}
                                    </td>
                                    <td>
                                        {{ detail.product_fitting.name }} ({{
                                            detail.product_name
                                        }}){{ generateIndication(detail.indication) }}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </template>
                    <template v-else>
                        <template v-for="detail in fitting_info.order_details" :key="`fitting-${detail.id}`">
                            <div class="ticket-body-item">
                                <div>
                                    {{
                                        settingsStore.business_settings.printer.kitchen_ticket_format !== 1
                                            ? `${!!isUpdate ? detail.quantity : detail.initial_quantity
                                            } x `
                                            : ""
                                    }}{{ detail.product_fitting.name }} ({{
                                        detail.product_name
                                    }}){{ generateIndication(detail.indication) }}
                                </div>
                                <div v-if="
                                    settingsStore.business_settings.printer
                                        .kitchen_ticket_format === 1
                                ">
                                    CANT:
                                    {{ !!isUpdate ? detail.quantity : detail.initial_quantity }}
                                </div>
                                <div class="indication" :style="{
                                    fontSize: `${settingsStore.business_settings.printer.body_font_size - 1
                                        }px`,
                                }">
                                    <template v-if="
                                        !!detail.product_description &&
                                        settingsStore.business_settings.printer
                                            .kitchen_ticket_format !== 3
                                    ">
                                        <div v-for="desc in detail.product_description.split(',')" :key="desc">
                                            *{{ desc }}
                                        </div>
                                    </template>
                                    <template v-for="(indication, index) in detail.indication" :key="index">
                                        <div class="indication-item" v-if="!!indication.description">
                                            -
                                            {{
                                                !indication.takeAway
                                                    ? indication.description
                                                    : indication.description + " [LLEVAR]"
                                            }}
                                        </div>
                                    </template>
                                    <div v-if="
                                        info.order_type !== 'M' &&
                                        detail.indication.some((ind) => ind.takeAway)
                                    " class="indication-extra">
                                        PARA LLEVAR: {{ indicationTakeAways(detail.indication) }}
                                    </div>
                                </div>
                            </div>
                        </template>
                    </template>
                </template>


            </div>
            <div class="ticket-footer" :style="{
                fontSize: `${settingsStore.business_settings.printer.footer_font_size}px`,
            }">
                <template v-if="
                    settingsStore.business_settings.printer.info_location === 'footer'
                ">
                    <div>{{ isUpdate ? info.created : info.modified }}</div>
                    <div>{{ info.username }}</div>
                </template>
            </div>
        </div>
    </div>
</template>

<script>
import { defineComponent, ref, computed } from "vue";
import { useSettingsStore } from "@/store/modules/settings";
import { useTableStore } from "@/store/modules/table";

export default defineComponent({
    name: "DefaultTicket",
    props: {
        data: {
            type: Object
        },
        place: {
            type: Object,
            default: undefined
        },
        isUpdate: {
            type: Boolean,
            default: false
        }
    },
    setup(props) {
        const settingsStore = useSettingsStore();
        const tableStore = useTableStore();

        const generateData = () => {
            let data = {
                ...props.data,
                order_details: !props.place || props.place?.is_default
                    ? props.data.order_details
                    : props.data.order_details.filter((detail) => {
                        // Debug: verificar el filtrado para menús
                        console.log('Filtering detail:', {
                            id: detail.id,
                            product_name: detail.product_name,
                            product_set: !!detail.product_set,
                            preparation_place: detail.preparation_place,
                            place_description: props.place.description,
                            will_include: settingsStore.business_settings.printer.subticket_mode &&
                                props.place.is_main
                                ? !!detail.preparation_place
                                : detail.preparation_place === props.place.description
                        });
                        
                        // Si es un menú (product_set existe), siempre incluirlo
                        if (detail.product_set) {
                            return true;
                        }
                        
                        // Para productos normales, aplicar la lógica original
                        return settingsStore.business_settings.printer.subticket_mode &&
                            props.place.is_main
                            ? !!detail.preparation_place
                            : detail.preparation_place === props.place.description;
                    }),
                table: !props.data.table
                    ? ""
                    : tableStore.getTableByID(props.data.table).description,
                json_sale: !props.data.json_sale
                    ? ""
                    : JSON.parse(props.data.json_sale)
            };
            data.order_details.forEach((detail) => {
                // Verificar si indication existe y es un array antes de usar map
                if (detail.indication && Array.isArray(detail.indication)) {
                    detail.indication = detail.indication.map((indication) => {
                        let desc = "";
                        if (indication.quick_indications && indication.quick_indications.length) {
                            indication.quick_indications.forEach((ind) => {
                                desc += `${ind}, `;
                            });
                        }
                        indication.description = !indication.description
                            ? desc.slice(0, -2)
                            : desc + indication.description;
                        return indication;
                    });
                } else {
                    // Si indication no es un array, inicializar como array vacío
                    detail.indication = [];
                }
                // if (
                //     detail.product_category.toLowerCase().includes("combo") &&
                //     settingsStore.business_settings.printer.kitchen_ticket_format === 3
                // ) {
                //     detail.product_name =
                //         detail.product_category +
                //         detail.product_description.replaceAll(",", "+");
                // }
            });
            return data;
        };

        const info = ref(generateData());

        const groupItems = (items) => {
            const grouped = [];
            const indexMap = new Map();
            for (const item of items) {
                const productName = item.product_name || item.product_set?.name || 'Desconocido';
                const indicationStr = JSON.stringify(item.indication || []);
                const descStr = item.product_description || '';
                const key = `${productName}_${indicationStr}_${descStr}`;
                
                if (indexMap.has(key)) {
                    const existingItem = grouped[indexMap.get(key)];
                    existingItem.initial_quantity = (existingItem.initial_quantity || existingItem.quantity || 0) + (item.initial_quantity || item.quantity || 0);
                    existingItem.quantity = (existingItem.quantity || 0) + (item.quantity || 0);
                } else {
                    const newItem = JSON.parse(JSON.stringify(item));
                    if (newItem.initial_quantity === undefined) {
                        newItem.initial_quantity = newItem.quantity || 0;
                    }
                    grouped.push(newItem);
                    indexMap.set(key, grouped.length - 1);
                }
            }
            return grouped;
        };

        const groupedDetails = computed(() => {
            const details = info.value?.order_details || []
            const orderByCustomer = !!(settingsStore.business_settings?.order?.order_by_customer)

            let groups = []
            if (!orderByCustomer) {
                // Encabezado genérico cuando NO se agrupa por cliente
                groups = [{ key: 'ALL', customerName: 'PRODUCTOS', items: details }]
            } else {
                const index = new Map()
                for (const d of details) {
                    const cid = d.customer?.id ?? 'NO_CUSTOMER'
                    const cname = d.customer?.name || d.customer?.full_name || (cid === 'NO_CUSTOMER' ? '' : `Cliente ${cid}`)
                    if (!index.has(cid)) {
                        index.set(cid, groups.length)
                        groups.push({ key: cid, customerName: cname, items: [] })
                    }
                    groups[index.get(cid)].items.push(d)
                }
            }

            groups.forEach(group => {
                group.items = groupItems(group.items);
            });

            return groups;
        })

        const groupedCancellations = computed(() => {
            return info.value?.order_canceleddetails || [];
        });

        const generateFittingData = () => {
            let data = {
                ...props.data,
                order_details: !props.place || props.place?.is_default
                    ? props.data.order_details
                    : props.data.order_details.filter(
                        (detail) =>
                            detail.product_fitting?.preparation_place ===
                            props.place.description
                    ),
                table: !props.data.table
                    ? ""
                    : tableStore.getTableByID(props.data.table).description,
                json_sale: !props.data.json_sale
                    ? ""
                    : JSON.parse(props.data.json_sale)
            };
            data.order_details.forEach((detail) => {
                detail.indication = detail.indication.map((indication) => {
                    let desc = "";
                    if (indication.quick_indications.length) {
                        indication.quick_indications.forEach((ind) => {
                            desc += `${ind}, `;
                        });
                    }
                    indication.description = !indication.description
                        ? desc.slice(0, -2)
                        : desc + indication.description;
                    return indication;
                });
            });
            return data;
        };

        const fitting_info = ref(generateFittingData());

        const indicationTakeAways = (indication) => {
            return indication.reduce((acc, curVal) => {
                curVal.takeAway && acc++;
                return acc;
            }, 0);
        };

        const getPrefix = (cat, productSet) => {
            let prefix = "";
            if (settingsStore.business_settings.printer.show_cat) {
                // Si hay product_set, determinar si es MENU o COMBO
                if (productSet) {
                    if (productSet.set_type === 'COMBO') {
                        prefix = "[COMBO] >> ";
                    } else if (productSet.set_type === 'MENU') {
                        prefix = "[MENU] ";
                    } else {
                        // Fallback: intentar determinar por categoría
                        prefix = "[MENU] ";
                    }
                }
                // Si no hay product_set, usar la lógica de categoría original
                else if (cat && cat.toLowerCase().includes("menu")) {
                    prefix = "[MENU] ";
                } else if (cat && cat.toLowerCase().includes("combo")) {
                    prefix = "[COMBO] >> ";
                } else if (cat && cat.toLowerCase().includes("porcion")) {
                    prefix = "[PORCION] >> ";
                } else if (cat) {
                    prefix = "[CARTA] >> ";
                }
            }
            return prefix;
        };

        const generateIndication = (ind) => {
            let text = "";
            for (const indication of ind) {
                if (!indication.description.includes("[]") || indication.quick_indications.length > 0) text += ` [${indication.description}]`;
            }
            return text;
        };

        return {
            info,
            fitting_info,
            getPrefix,
            generateIndication,
            settingsStore,
            indicationTakeAways,
            groupedDetails,
            groupedCancellations
        };
    }
});
</script>

<style lang="scss" scoped>
.ticket-customer {
  margin: 8px 0 4px 0;
  padding: 4px 0;
  border-top: 1px solid #000;
  border-bottom: 1px solid #000;
  text-align: center;
}

.ticket {
    font-family: Arial, Helvetica, sans-serif;
    background-color: White;
    line-height: normal;
    width: 252px;
    margin: 0 10px;

    &-header {
        font-weight: bold;
        text-align: center;
        margin-top: 10px;

        &-subtitle {
            word-spacing: 5px;
        }
    }

    table {
        border-collapse: collapse;
        th {
            border-bottom: 1px dotted black;
            vertical-align: bottom;
        }

        tr {
            td {
                border-bottom: 1px dotted black;
                vertical-align: top;
                padding-top: 2px;
                padding-bottom: 2px;
            }
        }
    }

    &-body {
        padding-top: 20px;
        padding-bottom: 10px;
        font-weight: bold;
        word-spacing: 5px;

        &-info {
            margin-bottom: 10px;
        }

        &-item {
            border-top: 1px dashed;
            padding-top: 10px;
        }

        .indication {
            margin-top: 5px;

            &-extra {
                margin-top: 5px;
            }
        }
        
        .menu-items {
            margin-top: 5px;
            margin-left: 10px;
            
            .menu-item {
                font-size: smaller;
                color: #666;
                line-height: 1.2;
                
                .phase-name {
                    font-style: italic;
                    font-size: smaller;
                }
            }
        }
        
        .menu-items-table {
            margin-top: 3px;
            font-size: smaller;
            
            .menu-item-table {
                color: #666;
                line-height: 1.1;
                margin-bottom: 1px;
            }
        }
    }

    &-footer {
        font-weight: bold;
    }
}
</style>
