<template>
    <div id="AdvancedSettings" class="settings-container">
        <!-- Sticky Header -->
        <div class="settings-header">
            <div class="header-left">
                <n-button circle @click="handleBack" size="large" quaternary class="mr-2">
                    <template #icon><v-icon name="md-arrowback-round" /></template>
                </n-button>
                <div>
                    <n-h2 class="m-0" style="font-weight: 700;">Configuración Avanzada</n-h2>
                    <n-text depth="3">Administra los parámetros avanzados del sistema.</n-text>
                </div>
            </div>
            <div class="header-actions">
                <n-space>
                <n-button 
                    :type="editMode ? 'info' : 'default'" 
                    size="large" 
                    strong
                    secondary 
                    @click="!editMode ? (editMode = true) : performUpdateBusinessSettings()"
                >
                    {{ editMode ? "Guardar Cambios" : "Editar Configuración" }}
                </n-button>
                <n-button 
                    type="error" 
                    size="large" 
                    secondary 
                    class="ml-2"
                    v-if="editMode" 
                    @click="resetSettings"
                >
                    Cancelar
                </n-button>
                </n-space>
            </div>
        </div>

        <n-card class="settings-body" :bordered="false" v-if="businessSettings && businessSettings.qz_config">
            <n-tabs type="line" placement="left" size="large" class="settings-tabs" animated>
                
                <!-- PESTAÑA: IMPRESIÓN Y FORMATOS -->
                <n-tab-pane name="impresiones" tab="Impresión y Formatos">
                    <template #tab>
                        <div class="tab-label">
                            <v-icon name="md-print-twotone" scale="1.2" class="mr-2" />
                            Impresión y Formatos
                        </div>
                    </template>
                    <div class="tab-content">
                        <n-h3 class="section-title">Motor de Impresión Kuceta</n-h3>
                        <n-text depth="3" class="section-desc">Configura la conexión con el motor local de WebSockets.</n-text>
                        <n-card class="settings-group-card mt-2" :bordered="true">
                            <n-form :disabled="!editMode" label-placement="top">
                                <n-grid responsive="screen" cols="1 s:1 m:2 l:2" x-gap="24" y-gap="12">
                                    <n-form-item-gi label="Host Pre-Cuentas">
                                        <n-input v-model:value="businessSettings.qz_config.host" size="large" />
                                    </n-form-item-gi>
                                    <n-form-item-gi label="WebSocket Host">
                                        <n-input v-model:value="businessSettings.qz_config.wbsockets_host" size="large" />
                                    </n-form-item-gi>
                                    <n-form-item-gi label="Firma (Signature)">
                                        <n-input type="textarea" v-model:value="businessSettings.qz_config.signature" rows="2" />
                                    </n-form-item-gi>
                                    <n-form-item-gi label="Certificado (Certificate)">
                                        <n-input type="textarea" v-model:value="businessSettings.qz_config.certificate" rows="2" />
                                    </n-form-item-gi>
                                </n-grid>
                            </n-form>
                        </n-card>

                        <n-h3 class="section-title mt-4">Nombres y Estructuras</n-h3>
                        <n-card class="settings-group-card mt-2" :bordered="true">
                            <n-form :disabled="!editMode" label-placement="top">
                                <n-grid responsive="screen" cols="1 s:2 m:3 l:4" x-gap="24" y-gap="12">
                                    <n-form-item-gi label="Impresora Para Llevar">
                                        <n-input v-model:value="businessSettings.printer.print_name_take_away" />
                                    </n-form-item-gi>
                                    <n-form-item-gi label="Impresora Delivery">
                                        <n-input v-model:value="businessSettings.printer.print_name_delivery" />
                                    </n-form-item-gi>
                                    <n-form-item-gi label="Ubicación Info.">
                                        <n-select v-model:value="businessSettings.printer.info_location" :options="infoLocationOptions" />
                                    </n-form-item-gi>
                                    <n-form-item-gi label="Formato Caja">
                                        <n-select v-model:value="businessSettings.printer.invoice_printer_format" :options="printOptions" />
                                    </n-form-item-gi>
                                    <n-form-item-gi label="Formato Cocina">
                                        <n-select v-model:value="businessSettings.printer.kitchen_printer_format" :options="printOptions" />
                                    </n-form-item-gi>
                                    <n-form-item-gi label="Estilo Cocina">
                                        <n-select v-model:value="businessSettings.printer.kitchen_ticket_format" :options="kitchenPrinterFormatOptions" />
                                    </n-form-item-gi>
                                </n-grid>
                            </n-form>
                        </n-card>

                        <n-h3 class="section-title mt-4">Tamaños de Letra (Kuceta)</n-h3>
                        <n-card class="settings-group-card mt-2" :bordered="true">
                            <n-form :disabled="!editMode" label-placement="top">
                                <n-grid responsive="screen" cols="2 s:3 m:6 l:6" x-gap="24" y-gap="12">
                                    <n-form-item-gi label="Cabecera"><n-input-number v-model:value="businessSettings.printer.header_font_size" :min="6" :max="50" /></n-form-item-gi>
                                    <n-form-item-gi label="Subtítulo"><n-input-number v-model:value="businessSettings.printer.sub_header_font_size" :min="6" :max="50" /></n-form-item-gi>
                                    <n-form-item-gi label="Cuerpo"><n-input-number v-model:value="businessSettings.printer.body_font_size" :min="6" :max="50" /></n-form-item-gi>
                                    <n-form-item-gi label="Pie pág."><n-input-number v-model:value="businessSettings.printer.footer_font_size" :min="6" :max="50" /></n-form-item-gi>
                                    <n-form-item-gi label="Delivery"><n-input-number v-model:value="businessSettings.printer.delivery_ticket_font_size" :min="6" :max="50" /></n-form-item-gi>
                                    <n-form-item-gi label="Pre-cuenta"><n-input-number v-model:value="businessSettings.printer.pre_account_ticket_font_size" :min="6" :max="50" /></n-form-item-gi>
                                </n-grid>
                            </n-form>
                        </n-card>

                        <n-h3 class="section-title mt-4">Márgenes (px)</n-h3>
                        <n-card class="settings-group-card mt-2" :bordered="true">
                            <n-form :disabled="!editMode" label-placement="top">
                                <n-grid responsive="screen" cols="2 s:2 m:4 l:4" x-gap="24" y-gap="12">
                                    <n-form-item-gi label="Superior"><n-input-number v-model:value="businessSettings.printer.margins[0]" :min="0" :max="25" /></n-form-item-gi>
                                    <n-form-item-gi label="Derecho"><n-input-number v-model:value="businessSettings.printer.margins[1]" :min="0" :max="25" /></n-form-item-gi>
                                    <n-form-item-gi label="Inferior"><n-input-number v-model:value="businessSettings.printer.margins[2]" :min="0" :max="25" /></n-form-item-gi>
                                    <n-form-item-gi label="Izquierdo"><n-input-number v-model:value="businessSettings.printer.margins[3]" :min="0" :max="25" /></n-form-item-gi>
                                </n-grid>
                            </n-form>
                        </n-card>

                        <n-h3 class="section-title mt-4">Ajustes Adicionales de Impresión</n-h3>
                        <n-card class="settings-group-card mt-2" :bordered="true">
                            <n-form :disabled="!editMode">
                                <div class="list-settings">
                                    <div class="list-item"><div class="item-text"><span>Mostrar categoría de producto</span></div><n-switch :disabled="!editMode" v-model:value="businessSettings.printer.show_cat" /></div>
                                    <div class="list-item"><div class="item-text"><span>Imprimir ticket de envío</span></div><n-switch :disabled="!editMode" v-model:value="businessSettings.printer.print_delivery_ticket" /></div>
                                    <div class="list-item"><div class="item-text"><span>Imprimir anulación en cocina</span></div><n-switch :disabled="!editMode" v-model:value="businessSettings.printer.auto_print_cancellation" /></div>
                                    <div class="list-item"><div class="item-text"><span>Items detallados</span></div><n-switch :disabled="!editMode" v-model:value="businessSettings.printer.detail_items" /></div>
                                    <div class="list-item"><div class="item-text"><span>Mostrar información de delivery</span></div><n-switch :disabled="!editMode" v-model:value="businessSettings.printer.show_delivery_kitchen" /></div>
                                    <div class="list-item"><div class="item-text"><span>Mostrar ambos nombres (Empresa)</span></div><n-switch :disabled="!editMode" v-model:value="businessSettings.printer.show_both_names" /></div>
                                    <div class="list-item"><div class="item-text"><span>Impresiones nativas</span><n-text depth="3" class="d-block text-xs">Usa comandos raw en vez de gráficos (más rápido pero menos estético).</n-text></div><n-switch :disabled="!editMode" v-model:value="businessSettings.printer.native_printing" /></div>
                                    <div class="list-item"><div class="item-text"><span>Impresiones HTML</span></div><n-switch :disabled="!editMode" v-model:value="businessSettings.printer.print_html" /></div>
                                    <div class="list-item"><div class="item-text"><span>Manejar guarniciones</span></div><n-switch :disabled="!editMode" v-model:value="businessSettings.printer.manage_fittings" /></div>
                                    <div class="list-item"><div class="item-text"><span>Modo subticket</span></div><n-switch :disabled="!editMode" v-model:value="businessSettings.printer.subticket_mode" /></div>
                                    <div class="list-item"><div class="item-text"><span>Texto extra</span></div><n-switch :disabled="!editMode" v-model:value="businessSettings.printer.extra_text" /></div>
                                    <div class="list-item border-none"><div class="item-text"><span>Precio de productos</span></div><n-switch :disabled="!editMode" v-model:value="businessSettings.printer.show_product_price" /></div>
                                </div>
                            </n-form>
                        </n-card>
                    </div>
                </n-tab-pane>

                <!-- PESTAÑA: VENTAS Y CAJA -->
                <n-tab-pane name="ventas" tab="Ventas y Caja">
                    <template #tab>
                        <div class="tab-label">
                            <v-icon name="md-pointofsale-twotone" scale="1.2" class="mr-2" />
                            Ventas y Caja
                        </div>
                    </template>
                    <div class="tab-content">
                        <n-h3 class="section-title">Parámetros Financieros</n-h3>
                        <n-card class="settings-group-card mt-2" :bordered="true">
                            <n-form :disabled="!editMode" label-placement="top">
                                <n-grid responsive="screen" cols="1 s:1 m:3 l:3" x-gap="24" y-gap="12">
                                    <n-form-item-gi label="Afectación por defecto">
                                        <n-select v-model:value="businessSettings.sale.default_affectation" :options="productStore.affectationsOptions" size="large" />
                                    </n-form-item-gi>
                                    <n-form-item-gi label="Tasa de IGV">
                                        <n-select v-model:value="current_igv_tax" :options="igvOptions" size="large" />
                                    </n-form-item-gi>
                                    <n-form-item-gi label="Valor ICBPER">
                                        <n-input v-model:value="businessSettings.sale.icbper_tax" size="large" />
                                    </n-form-item-gi>
                                </n-grid>
                            </n-form>
                        </n-card>

                        <n-h3 class="section-title mt-4">Comportamiento de Caja</n-h3>
                        <n-card class="settings-group-card mt-2" :bordered="true">
                            <n-form :disabled="!editMode">
                                <div class="list-settings">
                                    <div class="list-item"><div class="item-text"><span>Monto efectivo requerido al Cierre</span><n-text depth="3" class="d-block text-xs">Exige que el usuario cuente e ingrese el efectivo real antes de cerrar.</n-text></div><n-switch :disabled="!editMode" v-model:value="businessSettings.till.closure_cash_total" /></div>
                                    <div class="list-item border-none"><div class="item-text"><span>Monto delivery afecta caja</span><n-text depth="3" class="d-block text-xs">Los cobros de delivery suman al total de caja chica actual.</n-text></div><n-switch :disabled="!editMode" v-model:value="businessSettings.till.delivery_affects_till" /></div>
                                </div>
                            </n-form>
                        </n-card>

                        <n-h3 class="section-title mt-4">Políticas de Venta y Anulación</n-h3>
                        <n-card class="settings-group-card mt-2" :bordered="true">
                            <n-form :disabled="!editMode">
                                <div class="list-settings">
                                    <div class="list-item"><div class="item-text"><span>Auto envío CPE a SUNAT</span></div><n-switch :disabled="!editMode" v-model:value="businessSettings.sale.auto_send" /></div>
                                    <div class="list-item"><div class="item-text"><span>Ver y cambiar descuento en venta</span></div><n-switch :disabled="!editMode" v-model:value="businessSettings.sale.show_discount_label" /></div>
                                    <div class="list-item"><div class="item-text"><span>Motivo de anulación requerido</span></div><n-switch :disabled="!editMode" v-model:value="businessSettings.sale.required_null_reason" /></div>
                                    <div class="list-item"><div class="item-text"><span>Requerir clave de USUARIO para anular</span></div><n-switch :disabled="!editMode" v-model:value="businessSettings.sale.require_user_pass_to_null" @update:value="(val) => { if (val) businessSettings.sale.require_general_pass_to_null = false; }" /></div>
                                    <div class="list-item"><div class="item-text"><span>Requerir clave GENERAL para anular</span></div><n-switch :disabled="!editMode" v-model:value="businessSettings.sale.require_general_pass_to_null" @update:value="(val) => { if (val) businessSettings.sale.require_user_pass_to_null = false; }" /></div>
                                    <div class="list-item"><div class="item-text"><span>Requerir clave para editar venta</span></div><n-switch :disabled="!editMode" v-model:value="businessSettings.sale.require_pass_recovery" /></div>
                                    <div class="list-item"><div class="item-text"><span>Manejar afectaciones múltiples</span></div><n-switch :disabled="!editMode" v-model:value="businessSettings.sale.manage_affectations" /></div>
                                    <div class="list-item"><div class="item-text"><span>Mostrar previsualización</span></div><n-switch :disabled="!editMode" v-model:value="businessSettings.sale.show_preview" /></div>
                                    <div class="list-item"><div class="item-text"><span>Imprimir leyenda de bienes en Amazonia</span></div><n-switch :disabled="!editMode" v-model:value="businessSettings.sale.show_amazon_legend" /></div>
                                    <div class="list-item border-none"><div class="item-text"><span>Habilitar boletas/facturas</span></div><n-switch :disabled="!editMode" v-model:value="businessSettings.sale.enable_invoices" /></div>
                                </div>
                            </n-form>
                        </n-card>
                        
                        <n-h3 class="section-title mt-4">Créditos y Venta Libre</n-h3>
                        <n-card class="settings-group-card mt-2" :bordered="true">
                            <n-form :disabled="!editMode">
                                <div class="list-settings">
                                    <div class="list-item"><div class="item-text"><span>Habilitar créditos</span></div><n-switch :disabled="!editMode" v-model:value="businessSettings.sale.enable_credits" /></div>
                                    <div class="list-item"><div class="item-text"><span>Créditos por cliente</span></div><n-switch :disabled="!editMode" v-model:value="businessSettings.sale.customer_credits" /></div>
                                    <div class="list-item"><div class="item-text"><span>Venta libre habilitada</span></div><n-switch :disabled="!editMode" v-model:value="businessSettings.sale.free_sale" /></div>
                                    <div class="list-item"><div class="item-text"><span>Descontar stock en ventas libres (Por defecto)</span></div><n-switch :disabled="!editMode" v-model:value="businessSettings.sale.free_sale_deduct_stock_default" /></div>
                                    <div class="list-item" v-if="businessSettings.order"><div class="item-text"><span>Formato "Venta Rápida" en pedidos</span></div><n-switch :disabled="!editMode" v-model:value="businessSettings.order.fast_sale_format" /></div>
                                    <div class="list-item"><div class="item-text"><span>Venta libre afecta caja</span></div><n-switch :disabled="!editMode" v-model:value="businessSettings.sale.free_sale_affects_till" /></div>
                                    <div class="list-item border-none"><div class="item-text"><span>Venta libre emite comprobante</span></div><n-switch :disabled="!editMode" v-model:value="businessSettings.sale.free_sale_send_doc" /></div>
                                </div>
                            </n-form>
                        </n-card>
                    </div>
                </n-tab-pane>

                <!-- PESTAÑA: PEDIDOS Y CATEGORÍAS -->
                <n-tab-pane name="pedidos" tab="Pedidos y Categorías">
                    <template #tab>
                        <div class="tab-label">
                            <v-icon name="md-restaurantmenu-twotone" scale="1.2" class="mr-2" />
                            Pedidos y Categorías
                        </div>
                    </template>
                    <div class="tab-content">
                        <n-h3 class="section-title">Flujo de Pedidos</n-h3>
                        <n-card class="settings-group-card mt-2" :bordered="true">
                            <n-form :disabled="!editMode">
                                <n-grid responsive="screen" cols="1 s:1 m:2 l:2" x-gap="24" y-gap="12" class="mb-4">
                                    <n-form-item-gi label="Filtros por defecto activos" label-placement="top">
                                        <n-select v-model:value="businessSettings.order.default_filters" :options="orderTypeOptions" multiple size="large" />
                                    </n-form-item-gi>
                                    <n-form-item-gi label="Flujo de Autenticación para Mozos" label-placement="top">
                                        <n-select v-model:value="businessSettings.order.waiter_auth_mode" :options="waiterAuthModeOptions" size="large" />
                                    </n-form-item-gi>
                                </n-grid>
                                <div class="list-settings">
                                    <div class="list-item" v-if="businessSettings.order"><div class="item-text"><span>Dividir Delivery y Para Llevar</span></div><n-switch :disabled="!editMode" v-model:value="businessSettings.order.divide_delivery_takeaway" /></div>
                                    <div class="list-item"><div class="item-text"><span>Pedidos vinculados a Clientes</span></div><n-switch :disabled="!editMode" v-model:value="businessSettings.order.order_by_customer" /></div>
                                    <div class="list-item"><div class="item-text"><span>Ingresar nombre manual de cliente</span></div><n-switch :disabled="!editMode" v-model:value="businessSettings.order.order_customer_name" /></div>
                                    <div class="list-item"><div class="item-text"><span>Para llevar queda en pendiente</span></div><n-switch :disabled="!editMode" v-model:value="businessSettings.order.pending_takeaway" /></div>
                                    <div class="list-item"><div class="item-text"><span>Seleccionar usuario al tomar orden</span></div><n-switch :disabled="!editMode" v-model:value="businessSettings.order.select_order_user" /></div>
                                    <div class="list-item"><div class="item-text"><span>Mostrar total del pedido</span></div><n-switch :disabled="!editMode" v-model:value="businessSettings.order.table_order_total" /></div>
                                    <div class="list-item"><div class="item-text"><span>Motivo de anulación de pedido requerido</span></div><n-switch :disabled="!editMode" v-model:value="businessSettings.order.required_null_reason" /></div>
                                    <div class="list-item"><div class="item-text"><span>Imprimir categoría en ticket de pedido</span></div><n-switch :disabled="!editMode" v-model:value="businessSettings.order.print_category_on_order" /></div>
                                    <div class="list-item border-none"><div class="item-text"><span>Imprimir nombre del área en ticket</span></div><n-switch :disabled="!editMode" v-model:value="businessSettings.order.print_area_on_order" /></div>
                                </div>
                            </n-form>
                        </n-card>

                        <n-h3 class="section-title mt-4">Visual de Categorías</n-h3>
                        <n-card class="settings-group-card mt-2" :bordered="true">
                            <n-form :disabled="!editMode" label-placement="top">
                                <n-grid responsive="screen" cols="1 s:3 m:3 l:3" x-gap="24" y-gap="12">
                                    <n-form-item-gi label="Tamaño letra de categoría">
                                        <n-input-number v-model:value="businessSettings.category.area_text_size" placeholder="21" size="large" />
                                    </n-form-item-gi>
                                    <n-form-item-gi label="Ancho imagen producto">
                                        <n-input-number v-model:value="businessSettings.category.width_image_product" placeholder="40" size="large" />
                                    </n-form-item-gi>
                                    <n-form-item-gi label="Alto imagen producto">
                                        <n-input-number v-model:value="businessSettings.category.height_image_product" placeholder="40" size="large" />
                                    </n-form-item-gi>
                                </n-grid>
                                <div class="list-settings border-top">
                                    <div class="list-item border-none pt-4"><div class="item-text"><span>Usar imagen default de categoría</span></div><n-switch :disabled="!editMode" v-model:value="businessSettings.category.use_image" /></div>
                                </div>
                            </n-form>
                        </n-card>
                    </div>
                </n-tab-pane>

                <!-- PESTAÑA: MÓDULOS -->
                <n-tab-pane name="modulos" tab="Módulos Activos">
                    <template #tab>
                        <div class="tab-label">
                            <v-icon name="md-widgets-twotone" scale="1.2" class="mr-2" />
                            Módulos Activos
                        </div>
                    </template>
                    <div class="tab-content">
                        <n-h3 class="section-title">Habilitar/Deshabilitar Módulos</n-h3>
                        <n-text depth="3" class="section-desc mb-4 d-block">Controla qué secciones son visibles en la barra de navegación (Sidebar) para todo el negocio.</n-text>
                        <n-card class="settings-group-card mt-2" :bordered="true">
                            <n-form :disabled="!editMode">
                                <n-grid responsive="screen" cols="1 s:1 m:2 l:2" x-gap="48">
                                    <n-grid-item>
                                        <div class="list-settings">
                                            <div class="list-item"><div class="item-text"><span>Caja</span></div><n-switch :disabled="!editMode" v-model:value="businessSettings.modules.show_till" /></div>
                                            <div class="list-item"><div class="item-text"><span>Mesas</span></div><n-switch :disabled="!editMode" v-model:value="businessSettings.modules.show_tables" /></div>
                                            <div class="list-item"><div class="item-text"><span>Pedidos</span></div><n-switch :disabled="!editMode" v-model:value="businessSettings.modules.show_orders" /></div>
                                            <div class="list-item"><div class="item-text"><span>Ventas</span></div><n-switch :disabled="!editMode" v-model:value="businessSettings.modules.show_sales" /></div>
                                            <div class="list-item"><div class="item-text"><span>Anulaciones</span></div><n-switch :disabled="!editMode" v-model:value="businessSettings.modules.show_anulates" /></div>
                                            <div class="list-item"><div class="item-text"><span>Productos</span></div><n-switch :disabled="!editMode" v-model:value="businessSettings.modules.show_products" /></div>
                                            <div class="list-item border-none"><div class="item-text"><span>Reportes</span></div><n-switch :disabled="!editMode" v-model:value="businessSettings.modules.show_reports" /></div>
                                        </div>
                                    </n-grid-item>
                                    <n-grid-item>
                                        <div class="list-settings">
                                            <div class="list-item"><div class="item-text"><span>Menús</span></div><n-switch :disabled="!editMode" v-model:value="businessSettings.modules.show_menus" /></div>
                                            <div class="list-item"><div class="item-text"><span>Combos</span></div><n-switch :disabled="!editMode" v-model:value="businessSettings.modules.show_combos" /></div>
                                            <div class="list-item"><div class="item-text"><span>Proveedores</span></div><n-switch :disabled="!editMode" v-model:value="businessSettings.modules.show_suppliers" /></div>
                                            <div class="list-item"><div class="item-text"><span>Insumos</span></div><n-switch :disabled="!editMode" v-model:value="businessSettings.modules.show_supplies" /></div>
                                            <div class="list-item"><div class="item-text"><span>Kardex</span></div><n-switch :disabled="!editMode" v-model:value="businessSettings.modules.show_kardex" /></div>
                                            <div class="list-item"><div class="item-text"><span>Clientes</span></div><n-switch :disabled="!editMode" v-model:value="businessSettings.modules.show_customers" /></div>
                                            <div class="list-item border-none"><div class="item-text"><span>Cumpleaños</span></div><n-switch :disabled="!editMode" v-model:value="businessSettings.modules.show_birthdays" /></div>
                                        </div>
                                    </n-grid-item>
                                </n-grid>
                            </n-form>
                        </n-card>
                    </div>
                </n-tab-pane>

                <!-- PESTAÑA: INTEGRACIONES -->
                <n-tab-pane name="integraciones" tab="Integraciones API">
                    <template #tab>
                        <div class="tab-label">
                            <v-icon name="md-api" scale="1.2" class="mr-2" />
                            Integraciones
                        </div>
                    </template>
                    <div class="tab-content">
                        <n-h3 class="section-title">Integración de Clientes</n-h3>
                        <n-card class="settings-group-card mt-2" :bordered="true">
                            <n-form :disabled="!editMode" label-placement="top">
                                <n-form-item label="API Token Externo">
                                    <n-input type="textarea" v-model:value="businessSettings.customers.api_token" rows="3" placeholder="Inserta aquí tu Bearer Token" />
                                </n-form-item>
                            </n-form>
                        </n-card>
                    </div>
                </n-tab-pane>

                <!-- PESTAÑA: WHATSAPP -->
                <n-tab-pane name="whatsapp" tab="WhatsApp">
                    <template #tab>
                        <div class="tab-label">
                            <v-icon name="bi-whatsapp" scale="1.2" class="mr-2" style="color: #25D366" />
                            WhatsApp
                        </div>
                    </template>
                    <div class="tab-content">
                        <n-h3 class="section-title">Vinculación de WhatsApp (Zendy)</n-h3>
                        <n-text depth="3" class="section-desc">Vincula el número de WhatsApp de tu restaurante mediante código QR para enviar comprobantes y notificaciones desde tu propio celular.</n-text>

                        <!-- Tarjeta de Estado Principal -->
                        <n-card class="settings-group-card mt-3" :bordered="true">
                            <div class="d-flex justify-content-between align-items-center flex-wrap gap-3">
                                <div class="d-flex align-items-center gap-3">
                                    <v-icon name="bi-whatsapp" scale="2.5" :fill="whatsappStatus.is_ready ? '#25D366' : '#909399'" />
                                    <div>
                                        <div class="d-flex align-items-center gap-2">
                                            <n-tag :type="whatsappStatus.is_ready ? 'success' : 'default'" round size="small">
                                                {{ whatsappStatus.is_ready ? 'Conectado' : 'Desconectado' }}
                                            </n-tag>
                                            <span v-if="whatsappStatus.phone_number" class="fw-bold fs-6">
                                                +{{ whatsappStatus.phone_number }}
                                            </span>
                                        </div>
                                        <n-text depth="3" class="fs-7 d-block mt-1">
                                            {{ whatsappStatus.is_ready ? 'Los comprobantes se enviarán desde tu propio número de WhatsApp vinculado.' : 'Actualmente se utiliza el servicio de mensajería predeterminado del sistema (Emiteca).' }}
                                        </n-text>
                                    </div>
                                </div>
                                <div class="d-flex gap-2">
                                    <n-button
                                        v-if="!whatsappStatus.is_ready"
                                        type="success"
                                        secondary
                                        size="medium"
                                        @click="showWhatsAppModal = true"
                                    >
                                        <template #icon><v-icon name="bi-qr-code-scan" /></template>
                                        Vincular WhatsApp
                                    </n-button>
                                    <n-button
                                        v-else
                                        type="error"
                                        secondary
                                        size="medium"
                                        :loading="loadingLogout"
                                        @click="handleLogoutWhatsApp"
                                    >
                                        <template #icon><v-icon name="md-linkoff" /></template>
                                        Desvincular
                                    </n-button>
                                </div>
                            </div>
                        </n-card>

                        <!-- Alerta de Entrega Dual -->
                        <n-alert type="info" :show-icon="true" class="mt-3">
                            <strong>Entrega Dual Activa:</strong> Si tu celular no está vinculado o se desconecta temporalmente, el sistema continuará enviando los comprobantes con total normalidad a través del servicio predeterminado del sistema (Emiteca).
                        </n-alert>
                    </div>
                </n-tab-pane>
                
            </n-tabs>
        </n-card>

        <!-- Modal QR WhatsApp -->
        <WhatsAppQrModal v-model:show="showWhatsAppModal" @linked="onWhatsAppLinked" />
    </div>
</template>
<script>
import { defineComponent, ref, computed } from "vue";
import { useMessage } from "naive-ui";
import { useRouter } from "vue-router";
import { usePrinterStore } from "@/store/modules/printer";
import { useProductStore } from "@/store/modules/product";
import { useSettingsStore } from "@/store/modules/settings";
import { updateBusinessSettings, getWhatsAppStatus, logoutWhatsApp } from "@/api/modules/business";
import { cloneDeep } from "@/utils";
import WhatsAppQrModal from "./whatsapp/WhatsAppQrModal.vue";

export default defineComponent({
    name: "AdvancedSettings",
    components: {
        WhatsAppQrModal
    },
    setup() {
        const router = useRouter();
        const printerStore = usePrinterStore();
        const productStore = useProductStore();
        const optionsPrinters = ref();
        const settingsStore = useSettingsStore();
        const message = useMessage();
        const businessSettings = ref(cloneDeep(settingsStore.businessSettings));
        
        const initModules = (settings) => {
            if (!settings) return;
            if (!settings.modules) {
                settings.modules = {};
            }
            const defaultModules = {
                show_dashboard: true,
                show_till: true,
                show_tables: true,
                show_orders: true,
                show_sales: true,
                show_anulates: true,
                show_products: true,
                show_menus: true,
                show_combos: true,
                show_suppliers: true,
                show_supplies: true,
                show_kardex: true,
                show_customers: true,
                show_birthdays: true,
                show_reports: true,
                show_settings: true,
            };
            for (const key in defaultModules) {
                if (settings.modules[key] === undefined) {
                    settings.modules[key] = defaultModules[key];
                }
            }
        };

        initModules(businessSettings.value);

        import('vue').then(({ watch }) => {
            watch(() => settingsStore.businessSettings, (newVal) => {
                if (newVal && Object.keys(newVal).length > 0 && !editMode.value) {
                    businessSettings.value = cloneDeep(newVal);
                    initModules(businessSettings.value);
                }
            }, { deep: true });
        });

        const editMode = ref(false);

        const igvOptions = [
            { label: "18% - Régimen General (Costa / Sierra)", value: 0.18 },
            { label: "10.5% - MYPE Restaurantes (Ley 31556 - 2026)", value: 0.105 },
            { label: "10% - MYPE Restaurantes (Histórico)", value: 0.10 },
            { label: "0% - Exonerado / Amazonía (Ley 27037)", value: 0.00 }
        ];

        const current_igv_tax = computed({
            get: () => {
                const val = Number(businessSettings.value.sale?.igv_tax ?? 0.18);
                return val > 1 ? val / 100 : val;
            },
            set: (v) => {
                businessSettings.value.sale.igv_tax = Number(v);
            }
        });

        const printOptions = [
            {
                label: "80 mm",
                value: 80
            },
            {
                label: "58 mm",
                value: 58
            }
        ];

        const invoiceOptions = [
            {
                label: "FACTURA",
                value: 1
            },
            {
                label: "BOLETA",
                value: 3
            },
            {
                label: "N. VENTA",
                value: 80
            }
        ];

        const kitchenPrinterFormatOptions = [
            {
                label: "FORMATO 1",
                value: 1
            },
            {
                label: "FORMATO 2",
                value: 2
            },
            {
                label: "FORMATO 3",
                value: 3
            },
            {
                label: "FORMATO 4",
                value: 4
            }
        ];

        const infoLocationOptions = [
            {
                label: "Cabecera",
                value: "header"
            },
            {
                label: "Pie de página",
                value: "footer"
            }
        ];

        // Realiza la actualización de la configuración del negocio
        const performUpdateBusinessSettings = () => {
            updateBusinessSettings(businessSettings.value).then((response) => {
                if (response.status === 202) {
                    message.success("Actualizado correctamente!");
                    settingsStore.business_settings = response.data;
                    editMode.value = false;
                }
            }).catch((error) => {
                console.error(error);

            });
        };

        const handleBack = () => {
            router.push({ name: "HomeSettings" });
        };

        const resetSettings = () => {
            businessSettings.value = cloneDeep(settingsStore.businessSettings);
            editMode.value = false;
        };

        const orderTypeOptions = [
            {
                value: "M",
                label: "MESA"
            },
            {
                value: "P",
                label: "PARA LLEVAR"
            },
            {
                value: "D",
                label: "DELIVERY"
            }
        ];

        const waiterAuthModeOptions = [
            {
                value: "default",
                label: "Mozo predeterminado (Quien inició sesión)"
            },
            {
                value: "select",
                label: "Seleccionar responsable de una lista"
            },
            {
                value: "pin",
                label: "Ingresar código de usuario del responsable"
            }
        ];

        // Estado y funciones de WhatsApp (Zendy)
        const showWhatsAppModal = ref(false);
        const loadingLogout = ref(false);
        const whatsappStatus = ref({
            state: "disconnected",
            phone_number: null,
            is_ready: false
        });

        const fetchWhatsAppStatus = async () => {
            try {
                const res = await getWhatsAppStatus();
                if (res?.data) {
                    whatsappStatus.value = res.data;
                }
            } catch (err) {
                console.warn("Error al consultar estado de WhatsApp:", err);
            }
        };

        const handleLogoutWhatsApp = async () => {
            loadingLogout.value = true;
            try {
                const res = await logoutWhatsApp();
                if (res?.data?.success) {
                    message.success("WhatsApp desvinculado con éxito");
                    whatsappStatus.value = {
                        state: "disconnected",
                        phone_number: null,
                        is_ready: false
                    };
                    window.dispatchEvent(
                        new CustomEvent("whatsapp-status-changed", {
                            detail: { is_connected: false, phone_number: null },
                        })
                    );
                }
            } catch (err) {
                console.error("Error al desvincular WhatsApp:", err);
                message.error("No se pudo desvincular WhatsApp");
            } finally {
                loadingLogout.value = false;
            }
        };

        const onWhatsAppLinked = (data) => {
            whatsappStatus.value = {
                state: data?.state || "ready",
                phone_number: data?.phone_number || whatsappStatus.value.phone_number,
                is_ready: true
            };
            fetchWhatsAppStatus();
            window.dispatchEvent(
                new CustomEvent("whatsapp-status-changed", {
                    detail: { is_connected: true, phone_number: whatsappStatus.value.phone_number },
                })
            );
        };

        fetchWhatsAppStatus();

        return {
            current_igv_tax,
            igvOptions,
            handleBack,
            printOptions,
            invoiceOptions,
            printerStore,
            productStore,
            businessSettings,
            performUpdateBusinessSettings,
            editMode,
            optionsPrinters,
            resetSettings,
            kitchenPrinterFormatOptions,
            infoLocationOptions,
            orderTypeOptions,
            waiterAuthModeOptions,
            showWhatsAppModal,
            loadingLogout,
            whatsappStatus,
            fetchWhatsAppStatus,
            handleLogoutWhatsApp,
            onWhatsAppLinked
        };
    }
});
</script>



<style scoped lang="scss">
.settings-container {
    /* Eliminamos colores hardcodeados para heredar el tema global (Flizzy) */
    background-color: transparent;
    min-height: calc(100vh - 120px);
    display: flex;
    flex-direction: column;
}

.settings-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px 32px;
    background-color: var(--n-color, #ffffff);
    border-bottom: 1px solid var(--n-border-color, #efeff5);
    position: sticky;
    top: 0;
    z-index: 10;
    border-radius: 8px 8px 0 0;
}

.header-left {
    display: flex;
    align-items: center;
}

.settings-body {
    flex-grow: 1;
    background: transparent;
    padding: 12px 0;
}

.settings-tabs {
    --n-pane-padding: 16px 32px !important;
}

.tab-label {
    display: flex;
    align-items: center;
    font-size: 15px;
    font-weight: 500;
    padding: 4px 0;
}

.tab-content {
    width: 100%;
}

.section-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--n-text-color, #333639);
    margin-bottom: 4px;
}

.settings-group-card {
    background-color: var(--n-color, #ffffff);
    border-radius: 8px;
    border: 1px solid var(--n-border-color, #efeff5);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
}

.list-settings {
    display: flex;
    flex-direction: column;
}

.list-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 0;
    border-bottom: 1px solid var(--n-divider-color, #efeff5);
    
    &.border-none {
        border-bottom: none;
    }
}

.border-top {
    border-top: 1px solid var(--n-divider-color, #efeff5);
}

.item-text {
    display: flex;
    flex-direction: column;
    
    span {
        font-weight: 500;
        color: var(--n-text-color, #333639);
        font-size: 14px;
    }
}
</style>


