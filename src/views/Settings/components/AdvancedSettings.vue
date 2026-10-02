<template>
    <div id="AdvancedSettings" class="settings-container">
        <!-- Sticky Header Superior Moderno -->
        <div class="settings-header">
            <div class="header-left">
                <n-button circle @click="handleBack" size="large" quaternary class="back-btn">
                    <template #icon><v-icon name="md-arrowback-round" /></template>
                </n-button>
                <div class="header-title-box">
                    <div class="d-flex align-items-center gap-2">
                        <n-h2 class="m-0 page-title">Configuración Avanzada</n-h2>
                        <n-tag :type="editMode ? 'warning' : 'default'" round size="small" class="mode-tag">
                            <template #icon>
                                <v-icon :name="editMode ? 'ri-edit-fill' : 'md-lock-round'" />
                            </template>
                            {{ editMode ? "Modo Edición Activado" : "Solo Lectura" }}
                        </n-tag>
                    </div>
                    <n-text depth="3" class="page-subtitle">Personaliza parámetros globales de impresión, facturación, comandas y módulos.</n-text>
                </div>
            </div>

            <!-- Centro: Buscador Rápido de Parámetros -->
            <div class="header-search">
                <n-input
                    v-model:value="searchQuery"
                    placeholder="Buscar ajuste (ej. IGV, Kuzeta, Delivery, Clave...)"
                    clearable
                    size="medium"
                    class="search-input"
                >
                    <template #prefix>
                        <v-icon name="md-search-round" class="text-muted" />
                    </template>
                </n-input>
            </div>

            <!-- Derecha: Botones de Acción -->
            <div class="header-actions">
                <n-space align="center">
                    <n-button 
                        v-if="!editMode"
                        type="primary" 
                        size="large" 
                        strong
                        secondary
                        @click="editMode = true"
                        class="action-btn"
                    >
                        <template #icon><v-icon name="ri-edit-fill" /></template>
                        Editar Configuración
                    </n-button>
                    
                    <template v-else>
                        <n-button 
                            type="error" 
                            size="large" 
                            secondary 
                            @click="resetSettings"
                            :disabled="saving"
                        >
                            <template #icon><v-icon name="md-close-round" /></template>
                            Cancelar
                        </n-button>
                        <n-button 
                            type="success" 
                            size="large" 
                            strong
                            :loading="saving"
                            @click="performUpdateBusinessSettings"
                            class="action-btn save-btn"
                        >
                            <template #icon><v-icon name="md-save-round" /></template>
                            Guardar Cambios
                        </n-button>
                    </template>
                </n-space>
            </div>
        </div>

        <!-- Banner de Resultados si el usuario busca algo -->
        <transition name="fade">
            <div v-if="searchQuery.trim().length > 0" class="search-results-banner">
                <div class="d-flex align-items-center justify-content-between mb-2">
                    <span class="fs-7 fw-bold text-muted">
                        Coincidencias encontradas para "{{ searchQuery }}":
                    </span>
                    <n-button text size="tiny" @click="searchQuery = ''">Limpiar búsqueda</n-button>
                </div>
                <div class="d-flex flex-wrap gap-2">
                    <n-tag
                        v-for="item in searchMatches"
                        :key="item.key"
                        type="info"
                        round
                        clickable
                        @click="jumpToTab(item.tab)"
                        class="search-chip"
                    >
                        <v-icon :name="item.icon" class="me-1" />
                        <strong>{{ item.title }}</strong>
                        <span class="ms-1 text-muted">({{ item.tabName }})</span>
                    </n-tag>
                    <n-text v-if="searchMatches.length === 0" depth="3" class="fs-7">
                        No se encontraron opciones con ese término.
                    </n-text>
                </div>
            </div>
        </transition>

        <!-- Cuerpo Principal: Pestañas Modulares con Panel Dividido Fijo -->
        <div class="settings-body" v-if="businessSettings && businessSettings.qz_config">
            <n-tabs 
                v-model:value="activeTab" 
                type="line" 
                placement="left" 
                size="large" 
                class="settings-tabs"
            >
                
                <!-- 1. PESTAÑA: IMPRESIÓN Y TICKETS -->
                <n-tab-pane name="impresiones">
                    <template #tab>
                        <div class="tab-label-item">
                            <div class="tab-icon-wrapper print-color">
                                <v-icon name="md-print-round" />
                            </div>
                            <div class="tab-label-text">
                                <span class="tab-main-title">Impresión y Tickets</span>
                                <small class="tab-sub-title">Kuzeta, ticketeras y formatos</small>
                            </div>
                        </div>
                    </template>

                    <div class="tab-content-wrapper">
                        <!-- Card 1: Motor Local Kuzeta -->
                        <div class="settings-card-group">
                            <div class="card-group-header">
                                <div class="card-header-icon print-bg"><v-icon name="md-print-round" /></div>
                                <div>
                                    <h3 class="group-title">Motor Local de Impresión (Kuzeta)</h3>
                                    <p class="group-desc">Configuración del WebSocket local y nombres de ticketeras predeterminadas del sistema.</p>
                                </div>
                            </div>
                            
                            <n-card class="settings-inner-card" :bordered="true">
                                <n-form :disabled="!editMode" label-placement="top">
                                    <n-grid responsive="screen" cols="1 s:1 m:2 l:3" :x-gap="20" :y-gap="14">
                                        <n-form-item-gi label="Impresora de Pre-Cuentas (Kuzeta)">
                                            <n-input v-model:value="businessSettings.qz_config.host" placeholder="Ej: CAJA" size="large" />
                                            <template #feedback>Nombre de la ticketera en Kuzeta donde salen las pre-cuentas por defecto.</template>
                                        </n-form-item-gi>

                                        <n-form-item-gi label="Impresora de Comprobantes / Caja (Kuzeta)">
                                            <n-input v-model:value="businessSettings.sale.printer_name" placeholder="Ej: CAJA" size="large" />
                                            <template #feedback>Nombre de la ticketera en Kuzeta donde salen boletas, facturas y notas de venta.</template>
                                        </n-form-item-gi>

                                        <n-form-item-gi label="Kuzeta WebSocket (Canal / Host)">
                                            <n-input v-model:value="businessSettings.qz_config.wbsockets_host" placeholder="Ej: XD" size="large" />
                                            <template #feedback>Canal o identificador de escucha WebSocket con la bandeja local Kuzeta.</template>
                                        </n-form-item-gi>

                                        <n-form-item-gi label="Firma Criptográfica (Signature)" :span="2">
                                            <n-input type="textarea" v-model:value="businessSettings.qz_config.signature" rows="2" placeholder="Firma digital QZ/Kuzeta" />
                                        </n-form-item-gi>

                                        <n-form-item-gi label="Certificado Digital (Certificate)">
                                            <n-input type="textarea" v-model:value="businessSettings.qz_config.certificate" rows="2" placeholder="Certificado digital" />
                                        </n-form-item-gi>
                                    </n-grid>
                                </n-form>
                            </n-card>
                        </div>

                        <!-- Card 2: Enrutamiento y Formatos de Tickets -->
                        <div class="settings-card-group mt-4">
                            <div class="card-group-header">
                                <div class="card-header-icon format-bg"><v-icon name="md-description-twotone" /></div>
                                <div>
                                    <h3 class="group-title">Enrutamiento y Formatos de Tickets</h3>
                                    <p class="group-desc">Asignación de impresoras específicas para pedidos externos y dimensiones de papel.</p>
                                </div>
                            </div>

                            <n-card class="settings-inner-card" :bordered="true">
                                <n-form :disabled="!editMode" label-placement="top">
                                    <n-grid responsive="screen" cols="1 s:2 m:3 l:4" :x-gap="20" :y-gap="14">
                                        <n-form-item-gi label="Impresora Para Llevar">
                                            <n-input v-model:value="businessSettings.printer.print_name_take_away" placeholder="Ej: COCINA, LLEVAR..." />
                                        </n-form-item-gi>
                                        <n-form-item-gi label="Impresora Delivery">
                                            <n-input v-model:value="businessSettings.printer.print_name_delivery" placeholder="Ej: CAJA, DELIVERY..." />
                                        </n-form-item-gi>
                                        <n-form-item-gi label="Formato Ticket Caja">
                                            <n-select v-model:value="businessSettings.printer.invoice_printer_format" :options="printOptions" />
                                        </n-form-item-gi>
                                        <n-form-item-gi label="Formato Ticket Cocina">
                                            <n-select v-model:value="businessSettings.printer.kitchen_printer_format" :options="printOptions" />
                                        </n-form-item-gi>
                                        <n-form-item-gi label="Estilo Visual Comanda">
                                            <n-select v-model:value="businessSettings.printer.kitchen_ticket_format" :options="kitchenPrinterFormatOptions" />
                                        </n-form-item-gi>
                                        <n-form-item-gi label="Ubicación Info Empresa">
                                            <n-select v-model:value="businessSettings.printer.info_location" :options="infoLocationOptions" />
                                        </n-form-item-gi>
                                    </n-grid>
                                </n-form>
                            </n-card>
                        </div>

                        <!-- Card 3: Tamaños de Fuente y Márgenes -->
                        <div class="settings-card-group mt-4">
                            <div class="card-group-header">
                                <div class="card-header-icon font-bg"><v-icon name="md-text-fields" /></div>
                                <div>
                                    <h3 class="group-title">Tipografía y Márgenes de Impresión (px)</h3>
                                    <p class="group-desc">Calibra el tamaño exacto del texto y los márgenes en milímetros/píxeles de la ticketera.</p>
                                </div>
                            </div>

                            <n-card class="settings-inner-card" :bordered="true">
                                <n-form :disabled="!editMode" label-placement="top">
                                    <div class="sub-section-title">Tamaños de Letra (Puntos Tipográficos)</div>
                                    <n-grid responsive="screen" cols="2 s:3 m:6 l:6" :x-gap="16" :y-gap="12" class="mb-4">
                                        <n-form-item-gi label="Cabecera"><n-input-number v-model:value="businessSettings.printer.header_font_size" :min="6" :max="50" /></n-form-item-gi>
                                        <n-form-item-gi label="Subtítulo"><n-input-number v-model:value="businessSettings.printer.sub_header_font_size" :min="6" :max="50" /></n-form-item-gi>
                                        <n-form-item-gi label="Cuerpo"><n-input-number v-model:value="businessSettings.printer.body_font_size" :min="6" :max="50" /></n-form-item-gi>
                                        <n-form-item-gi label="Pie de Página"><n-input-number v-model:value="businessSettings.printer.footer_font_size" :min="6" :max="50" /></n-form-item-gi>
                                        <n-form-item-gi label="Delivery"><n-input-number v-model:value="businessSettings.printer.delivery_ticket_font_size" :min="6" :max="50" /></n-form-item-gi>
                                        <n-form-item-gi label="Pre-cuenta"><n-input-number v-model:value="businessSettings.printer.pre_account_ticket_font_size" :min="6" :max="50" /></n-form-item-gi>
                                    </n-grid>

                                    <div class="sub-section-title mt-3">Márgenes de Papel</div>
                                    <n-grid v-if="businessSettings.printer?.margins?.length >= 4" responsive="screen" cols="2 s:2 m:4 l:4" :x-gap="16" :y-gap="12">
                                        <n-form-item-gi label="Superior (px)"><n-input-number v-model:value="businessSettings.printer.margins[0]" :min="0" :max="25" /></n-form-item-gi>
                                        <n-form-item-gi label="Derecho (px)"><n-input-number v-model:value="businessSettings.printer.margins[1]" :min="0" :max="25" /></n-form-item-gi>
                                        <n-form-item-gi label="Inferior (px)"><n-input-number v-model:value="businessSettings.printer.margins[2]" :min="0" :max="25" /></n-form-item-gi>
                                        <n-form-item-gi label="Izquierdo (px)"><n-input-number v-model:value="businessSettings.printer.margins[3]" :min="0" :max="25" /></n-form-item-gi>
                                    </n-grid>
                                </n-form>
                            </n-card>
                        </div>

                        <!-- Card 4: Opciones de Comanda y Modos Especiales -->
                        <div class="settings-card-group mt-4">
                            <div class="card-group-header">
                                <div class="card-header-icon rules-bg"><v-icon name="md-checklist-round" /></div>
                                <div>
                                    <h3 class="group-title">Comportamiento y Reglas de Impresión</h3>
                                    <p class="group-desc">Activa o desactiva qué elementos se plasman físicamente en tickets de cocina y caja.</p>
                                </div>
                            </div>

                            <n-card class="settings-inner-card" :bordered="true">
                                <div class="clean-switch-grid">
                                    <div class="switch-row-item">
                                        <div class="switch-row-text">
                                            <span class="switch-row-title">Mostrar categoría de producto en comanda</span>
                                            <span class="switch-row-desc">Imprime el nombre de la categoría sobre cada plato o producto.</span>
                                        </div>
                                        <n-switch :disabled="!editMode" v-model:value="businessSettings.printer.show_cat" />
                                    </div>

                                    <div class="switch-row-item">
                                        <div class="switch-row-text">
                                            <span class="switch-row-title">Imprimir ticket de envío (Delivery)</span>
                                            <span class="switch-row-desc">Genera copia para el repartidor con datos del cliente y destino.</span>
                                        </div>
                                        <n-switch :disabled="!editMode" v-model:value="businessSettings.printer.print_delivery_ticket" />
                                    </div>

                                    <div class="switch-row-item">
                                        <div class="switch-row-text">
                                            <span class="switch-row-title">Imprimir anulación de platos en cocina</span>
                                            <span class="switch-row-desc">Emite comanda de advertencia en cocina si un plato fue eliminado del pedido.</span>
                                        </div>
                                        <n-switch :disabled="!editMode" v-model:value="businessSettings.printer.auto_print_cancellation" />
                                    </div>

                                    <div class="switch-row-item">
                                        <div class="switch-row-text">
                                            <span class="switch-row-title">Imprimir anulación de mesa en cocina</span>
                                            <span class="switch-row-desc">Emite comanda en cocina si se cancela una mesa por completo.</span>
                                        </div>
                                        <n-switch :disabled="!editMode" v-model:value="businessSettings.printer.auto_print_table_cancellation" />
                                    </div>

                                    <div class="switch-row-item">
                                        <div class="switch-row-text">
                                            <span class="switch-row-title">Ítems detallados</span>
                                            <span class="switch-row-desc">Desglosa insumos y complementos de cada producto en la impresión.</span>
                                        </div>
                                        <n-switch :disabled="!editMode" v-model:value="businessSettings.printer.detail_items" />
                                    </div>

                                    <div class="switch-row-item">
                                        <div class="switch-row-text">
                                            <span class="switch-row-title">Mostrar información de delivery en cocina</span>
                                            <span class="switch-row-desc">Incluye nombre del cliente y notas de entrega en el ticket de cocina.</span>
                                        </div>
                                        <n-switch :disabled="!editMode" v-model:value="businessSettings.printer.show_delivery_kitchen" />
                                    </div>

                                    <div class="switch-row-item">
                                        <div class="switch-row-text">
                                            <span class="switch-row-title">Mostrar ambos nombres (Razón Social y Comercial)</span>
                                            <span class="switch-row-desc">Imprime en la cabecera tanto la Razón Social como el Nombre Comercial.</span>
                                        </div>
                                        <n-switch :disabled="!editMode" v-model:value="businessSettings.printer.show_both_names" />
                                    </div>

                                    <div class="switch-row-item">
                                        <div class="switch-row-text">
                                            <span class="switch-row-title">Impresiones nativas (Comandos Raw)</span>
                                            <span class="switch-row-desc">Utiliza código ESC/POS directo en vez de renderizado de imagen (más rápido).</span>
                                        </div>
                                        <n-switch :disabled="!editMode" v-model:value="businessSettings.printer.native_printing" />
                                    </div>

                                    <div class="switch-row-item">
                                        <div class="switch-row-text">
                                            <span class="switch-row-title">Impresiones HTML</span>
                                            <span class="switch-row-desc">Habilita plantillas dinámicas en HTML para mayor fidelidad visual.</span>
                                        </div>
                                        <n-switch :disabled="!editMode" v-model:value="businessSettings.printer.print_html" />
                                    </div>

                                    <div class="switch-row-item">
                                        <div class="switch-row-text">
                                            <span class="switch-row-title">Manejar guarniciones</span>
                                            <span class="switch-row-desc">Permite imprimir tickets separados para preparaciones de guarnición.</span>
                                        </div>
                                        <n-switch :disabled="!editMode" v-model:value="businessSettings.printer.manage_fittings" />
                                    </div>

                                    <div class="switch-row-item">
                                        <div class="switch-row-text">
                                            <span class="switch-row-title">Modo subticket</span>
                                            <span class="switch-row-desc">Divide comandas extensas en sub-tickets por grupos de cocina.</span>
                                        </div>
                                        <n-switch :disabled="!editMode" v-model:value="businessSettings.printer.subticket_mode" />
                                    </div>

                                    <div class="switch-row-item">
                                        <div class="switch-row-text">
                                            <span class="switch-row-title">Texto extra en comanda</span>
                                            <span class="switch-row-desc">Permite añadir notas e indicaciones extendidas en el pie del ticket.</span>
                                        </div>
                                        <n-switch :disabled="!editMode" v-model:value="businessSettings.printer.extra_text" />
                                    </div>

                                    <div class="switch-row-item">
                                        <div class="switch-row-text">
                                            <span class="switch-row-title">Mostrar precio de productos en comanda</span>
                                            <span class="switch-row-desc">Imprime el costo o precio en el ticket que va a cocina.</span>
                                        </div>
                                        <n-switch :disabled="!editMode" v-model:value="businessSettings.printer.show_product_price" />
                                    </div>
                                </div>
                            </n-card>
                        </div>
                    </div>
                </n-tab-pane>

                <!-- 2. PESTAÑA: VENTAS Y FACTURACIÓN -->
                <n-tab-pane name="ventas">
                    <template #tab>
                        <div class="tab-label-item">
                            <div class="tab-icon-wrapper sales-color">
                                <v-icon name="md-pointofsale-twotone" />
                            </div>
                            <div class="tab-label-text">
                                <span class="tab-main-title">Ventas y Facturación</span>
                                <small class="tab-sub-title">SUNAT, impuestos y políticas</small>
                            </div>
                        </div>
                    </template>

                    <div class="tab-content-wrapper">
                        <!-- Card 1: Comprobantes e Impuestos -->
                        <div class="settings-card-group">
                            <div class="card-group-header">
                                <div class="card-header-icon sales-bg"><v-icon name="md-pointofsale-twotone" /></div>
                                <div>
                                    <h3 class="group-title">Parámetros de Comprobantes e Impuestos</h3>
                                    <p class="group-desc">Define la ticketera de caja, tipos de documento por defecto y tasas tributarias SUNAT.</p>
                                </div>
                            </div>

                            <n-card class="settings-inner-card" :bordered="true">
                                <n-form :disabled="!editMode" label-placement="top">
                                    <n-grid responsive="screen" cols="1 s:2 m:3 l:5" :x-gap="20" :y-gap="14">
                                        <n-form-item-gi label="Impresora de Comprobantes (Caja)">
                                            <n-input v-model:value="businessSettings.sale.printer_name" placeholder="Ej: CAJA" size="large" />
                                            <template #feedback>Nombre en Kuzeta para tickets de venta.</template>
                                        </n-form-item-gi>

                                        <n-form-item-gi label="Documento por Defecto">
                                            <n-select v-model:value="businessSettings.sale.default_invoice" :options="invoiceOptions" size="large" />
                                            <template #feedback>Tipo inicial al abrir ventana de cobro.</template>
                                        </n-form-item-gi>

                                        <n-form-item-gi label="Afectación IGV por Defecto">
                                            <n-select v-model:value="businessSettings.sale.default_affectation" :options="productStore.affectationsOptions" size="large" />
                                            <template #feedback>Gravado, exonerado o inafecto.</template>
                                        </n-form-item-gi>

                                        <n-form-item-gi label="Tasa de IGV">
                                            <n-select v-model:value="current_igv_tax" :options="igvOptions" size="large" />
                                            <template #feedback>Régimen General 18% o MYPE 10.5%.</template>
                                        </n-form-item-gi>

                                        <n-form-item-gi label="Impuesto ICBPER (Bolsas)">
                                            <n-input v-model:value="businessSettings.sale.icbper_tax" placeholder="0.4" size="large" />
                                            <template #feedback>Tasa de bolsas plásticas (S/.).</template>
                                        </n-form-item-gi>
                                    </n-grid>
                                </n-form>
                            </n-card>
                        </div>

                        <!-- Card 2: Políticas de Venta y Anulación -->
                        <div class="settings-card-group mt-4">
                            <div class="card-group-header">
                                <div class="card-header-icon security-bg"><v-icon name="md-lock-round" /></div>
                                <div>
                                    <h3 class="group-title">Políticas de Venta y Permisos de Anulación</h3>
                                    <p class="group-desc">Reglas de seguridad para anular ventas, solicitar contraseñas y emitir comprobantes.</p>
                                </div>
                            </div>

                            <n-card class="settings-inner-card" :bordered="true">
                                <div class="clean-switch-grid">
                                    <div class="switch-row-item">
                                        <div class="switch-row-text">
                                            <span class="switch-row-title">Impresión automática de comprobantes</span>
                                            <span class="switch-row-desc">Imprime el ticket o comprobante en automático al momento de cobrar.</span>
                                        </div>
                                        <n-switch :disabled="!editMode" v-model:value="businessSettings.sale.auto_print" />
                                    </div>

                                    <div class="switch-row-item">
                                        <div class="switch-row-text">
                                            <span class="switch-row-title">Auto envío de comprobante CPE a SUNAT</span>
                                            <span class="switch-row-desc">Envía el XML firmado a SUNAT inmediatamente tras emitir el comprobante.</span>
                                        </div>
                                        <n-switch :disabled="!editMode" v-model:value="businessSettings.sale.auto_send" />
                                    </div>

                                    <div class="switch-row-item">
                                        <div class="switch-row-text">
                                            <span class="switch-row-title">Ver y modificar descuento en ventana de cobro</span>
                                            <span class="switch-row-desc">Muestra la casilla de descuento global para el cajero antes de pagar.</span>
                                        </div>
                                        <n-switch :disabled="!editMode" v-model:value="businessSettings.sale.show_discount_label" />
                                    </div>

                                    <div class="switch-row-item">
                                        <div class="switch-row-text">
                                            <span class="switch-row-title">Motivo de anulación de venta obligatorio</span>
                                            <span class="switch-row-desc">Exige al cajero escribir el motivo formal antes de revertir una venta.</span>
                                        </div>
                                        <n-switch :disabled="!editMode" v-model:value="businessSettings.sale.required_null_reason" />
                                    </div>

                                    <div class="switch-row-item">
                                        <div class="switch-row-text">
                                            <span class="switch-row-title">Requerir contraseña del USUARIO para anular</span>
                                            <span class="switch-row-desc">El usuario autenticado debe ingresar su propia contraseña para anular.</span>
                                        </div>
                                        <n-switch 
                                            :disabled="!editMode" 
                                            v-model:value="businessSettings.sale.require_user_pass_to_null" 
                                            @update:value="(val) => { if (val) businessSettings.sale.require_general_pass_to_null = false; }" 
                                        />
                                    </div>

                                    <div class="switch-row-item">
                                        <div class="switch-row-text">
                                            <span class="switch-row-title">Requerir contraseña GENERAL de Administrador para anular</span>
                                            <span class="switch-row-desc">Exige la clave maestra administrativa para anular cualquier comprobante.</span>
                                        </div>
                                        <n-switch 
                                            :disabled="!editMode" 
                                            v-model:value="businessSettings.sale.require_general_pass_to_null" 
                                            @update:value="(val) => { if (val) businessSettings.sale.require_user_pass_to_null = false; }" 
                                        />
                                    </div>

                                    <div class="switch-row-item">
                                        <div class="switch-row-text">
                                            <span class="switch-row-title">Requerir contraseña para editar venta</span>
                                            <span class="switch-row-desc">Solicita clave de seguridad para modificar documentos ya registrados.</span>
                                        </div>
                                        <n-switch :disabled="!editMode" v-model:value="businessSettings.sale.require_pass_recovery" />
                                    </div>

                                    <div class="switch-row-item">
                                        <div class="switch-row-text">
                                            <span class="switch-row-title">Manejar afectaciones múltiples</span>
                                            <span class="switch-row-desc">Permite mezclar productos gravados y exonerados en un mismo comprobante.</span>
                                        </div>
                                        <n-switch :disabled="!editMode" v-model:value="businessSettings.sale.manage_affectations" />
                                    </div>

                                    <div class="switch-row-item">
                                        <div class="switch-row-text">
                                            <span class="switch-row-title">Mostrar previsualización de comprobante</span>
                                            <span class="switch-row-desc">Abre vista previa en pantalla antes de enviar a la ticketera física.</span>
                                        </div>
                                        <n-switch :disabled="!editMode" v-model:value="businessSettings.sale.show_preview" />
                                    </div>

                                    <div class="switch-row-item">
                                        <div class="switch-row-text">
                                            <span class="switch-row-title">Habilitar boletas y facturas electrónicas</span>
                                            <span class="switch-row-desc">Permite emitir comprobantes válidos ante SUNAT además de notas de venta.</span>
                                        </div>
                                        <n-switch :disabled="!editMode" v-model:value="businessSettings.sale.enable_invoices" />
                                    </div>

                                    <div class="switch-row-item">
                                        <div class="switch-row-text">
                                            <span class="switch-row-title">Imprimir leyenda de bienes en Amazonía (Ley 27037)</span>
                                            <span class="switch-row-desc">Incluye la leyenda legal obligatoria para empresas de la selva peruana.</span>
                                        </div>
                                        <n-switch :disabled="!editMode" v-model:value="businessSettings.sale.show_amazon_legend" />
                                    </div>
                                </div>
                            </n-card>
                        </div>

                        <!-- Card 3: Créditos y Venta Libre -->
                        <div class="settings-card-group mt-4">
                            <div class="card-group-header">
                                <div class="card-header-icon free-bg"><v-icon name="bi-cash-coin" /></div>
                                <div>
                                    <h3 class="group-title">Créditos y Venta Rápida / Libre</h3>
                                    <p class="group-desc">Configuración para cuentas por cobrar y ventas directas de mostrador.</p>
                                </div>
                            </div>

                            <n-card class="settings-inner-card" :bordered="true">
                                <div class="clean-switch-grid">
                                    <div class="switch-row-item">
                                        <div class="switch-row-text">
                                            <span class="switch-row-title">Habilitar ventas a crédito</span>
                                            <span class="switch-row-desc">Permite registrar cobros pendientes de pago a clientes autorizados.</span>
                                        </div>
                                        <n-switch :disabled="!editMode" v-model:value="businessSettings.sale.enable_credits" />
                                    </div>

                                    <div class="switch-row-item">
                                        <div class="switch-row-text">
                                            <span class="switch-row-title">Créditos individualizados por cliente</span>
                                            <span class="switch-row-desc">Lleva historial y estados de cuenta independientes por cada cliente.</span>
                                        </div>
                                        <n-switch :disabled="!editMode" v-model:value="businessSettings.sale.customer_credits" />
                                    </div>

                                    <div class="switch-row-item">
                                        <div class="switch-row-text">
                                            <span class="switch-row-title">Venta libre habilitada (Mostrador rápido)</span>
                                            <span class="switch-row-desc">Permite ventas directas sin necesidad de abrir una mesa en el salón.</span>
                                        </div>
                                        <n-switch :disabled="!editMode" v-model:value="businessSettings.sale.free_sale" />
                                    </div>

                                    <div class="switch-row-item">
                                        <div class="switch-row-text">
                                            <span class="switch-row-title">Descontar stock en ventas libres por defecto</span>
                                            <span class="switch-row-desc">Resta automáticamente del inventario los productos cobrados en venta libre.</span>
                                        </div>
                                        <n-switch :disabled="!editMode" v-model:value="businessSettings.sale.free_sale_deduct_stock_default" />
                                    </div>

                                    <div class="switch-row-item">
                                        <div class="switch-row-text">
                                            <span class="switch-row-title">Venta libre afecta caja</span>
                                            <span class="switch-row-desc">Suma el dinero cobrado directamente a la sesión de caja activa.</span>
                                        </div>
                                        <n-switch :disabled="!editMode" v-model:value="businessSettings.sale.free_sale_affects_till" />
                                    </div>

                                    <div class="switch-row-item">
                                        <div class="switch-row-text">
                                            <span class="switch-row-title">Venta libre emite comprobante</span>
                                            <span class="switch-row-desc">Genera comprobante oficial (Boleta/Factura) en ventas de mostrador.</span>
                                        </div>
                                        <n-switch :disabled="!editMode" v-model:value="businessSettings.sale.free_sale_send_doc" />
                                    </div>

                                    <div class="switch-row-item" v-if="businessSettings.order">
                                        <div class="switch-row-text">
                                            <span class="switch-row-title">Formato de "Venta Rápida" en pedidos</span>
                                            <span class="switch-row-desc">Optimiza la pantalla para negocios con atención ultra-rápida (Fast Food).</span>
                                        </div>
                                        <n-switch :disabled="!editMode" v-model:value="businessSettings.order.fast_sale_format" />
                                    </div>
                                </div>
                            </n-card>
                        </div>
                    </div>
                </n-tab-pane>

                <!-- 3. PESTAÑA: GESTIÓN DE CAJA -->
                <n-tab-pane name="caja">
                    <template #tab>
                        <div class="tab-label-item">
                            <div class="tab-icon-wrapper till-color">
                                <v-icon name="bi-cash-stack" />
                            </div>
                            <div class="tab-label-text">
                                <span class="tab-main-title">Gestión de Caja</span>
                                <small class="tab-sub-title">Arqueo, cierre y flujos</small>
                            </div>
                        </div>
                    </template>

                    <div class="tab-content-wrapper" v-if="businessSettings.till">
                        <div class="settings-card-group">
                            <div class="card-group-header">
                                <div class="card-header-icon till-bg"><v-icon name="bi-cash-stack" /></div>
                                <div>
                                    <h3 class="group-title">Reglas de Operación y Cuadre de Caja</h3>
                                    <p class="group-desc">Condiciones obligatorias para apertura, ingresos por delivery y cierre formal de sesión.</p>
                                </div>
                            </div>

                            <n-card class="settings-inner-card" :bordered="true">
                                <div class="clean-switch-grid">
                                    <div class="switch-row-item">
                                        <div class="switch-row-text">
                                            <span class="switch-row-title">Monto de efectivo obligatorio en Cierre de Caja (Arqueo ciego)</span>
                                            <span class="switch-row-desc">Obliga al cajero a contar e ingresar el efectivo real antes de mostrar el balance del sistema.</span>
                                        </div>
                                        <n-switch :disabled="!editMode" v-model:value="businessSettings.till.closure_cash_total" />
                                    </div>

                                    <div class="switch-row-item">
                                        <div class="switch-row-text">
                                            <span class="switch-row-title">Monto de cobros por Delivery ingresa a Caja</span>
                                            <span class="switch-row-desc">Los ingresos recibidos por repartidores se acumulan en el efectivo de la caja chica.</span>
                                        </div>
                                        <n-switch :disabled="!editMode" v-model:value="businessSettings.till.delivery_affects_till" />
                                    </div>
                                </div>
                            </n-card>
                        </div>
                    </div>
                </n-tab-pane>

                <!-- 4. PESTAÑA: PEDIDOS Y CARTA -->
                <n-tab-pane name="pedidos">
                    <template #tab>
                        <div class="tab-label-item">
                            <div class="tab-icon-wrapper order-color">
                                <v-icon name="md-dining-twotone" />
                            </div>
                            <div class="tab-label-text">
                                <span class="tab-main-title">Pedidos y Carta</span>
                                <small class="tab-sub-title">Salón, mozos y categorías</small>
                            </div>
                        </div>
                    </template>

                    <div class="tab-content-wrapper">
                        <!-- Card 1: Flujo de Pedidos y Mozos -->
                        <div class="settings-card-group" v-if="businessSettings.order">
                            <div class="card-group-header">
                                <div class="card-header-icon order-bg"><v-icon name="md-dining-twotone" /></div>
                                <div>
                                    <h3 class="group-title">Flujo de Pedidos, Mozos y Comandas</h3>
                                    <p class="group-desc">Reglas de interacción en mesas de salón, pedidos para llevar y asignación de responsables.</p>
                                </div>
                            </div>

                            <n-card class="settings-inner-card" :bordered="true">
                                <n-form :disabled="!editMode" label-placement="top">
                                    <n-grid responsive="screen" cols="1 s:1 m:2 l:2" :x-gap="20" :y-gap="14" class="mb-4">
                                        <n-form-item-gi label="Filtros Rápidos por Defecto en Pedidos">
                                            <n-select v-model:value="businessSettings.order.default_filters" :options="orderTypeOptions" multiple size="large" />
                                            <template #feedback>MESA (M), PARA LLEVAR (P) y DELIVERY (D).</template>
                                        </n-form-item-gi>

                                        <n-form-item-gi label="Flujo de Autenticación para Mozos">
                                            <n-select v-model:value="businessSettings.order.waiter_auth_mode" :options="waiterAuthModeOptions" size="large" />
                                            <template #feedback>Mozo predeterminado, selector en lista o código PIN.</template>
                                        </n-form-item-gi>
                                    </n-grid>

                                    <div class="clean-switch-grid border-top pt-3">
                                        <div class="switch-row-item">
                                            <div class="switch-row-text">
                                                <span class="switch-row-title">Dividir pedidos de Delivery y Para Llevar</span>
                                                <span class="switch-row-desc">Muestra pestañas separadas para gestionar envíos a domicilio y retiros en tienda.</span>
                                            </div>
                                            <n-switch :disabled="!editMode" v-model:value="businessSettings.order.divide_delivery_takeaway" />
                                        </div>

                                        <div class="switch-row-item">
                                            <div class="switch-row-text">
                                                <span class="switch-row-title">Pedidos agrupados por clientes</span>
                                                <span class="switch-row-desc">Permite dividir una sola mesa en múltiples sub-cuentas por comensal.</span>
                                            </div>
                                            <n-switch :disabled="!editMode" v-model:value="businessSettings.order.order_by_customer" />
                                        </div>

                                        <div class="switch-row-item">
                                            <div class="switch-row-text">
                                                <span class="switch-row-title">Ingresar nombre manual de cliente en el pedido</span>
                                                <span class="switch-row-desc">Habilita un campo libre para identificar al cliente sin registrarlo formalmente.</span>
                                            </div>
                                            <n-switch :disabled="!editMode" v-model:value="businessSettings.order.order_customer_name" />
                                        </div>

                                        <div class="switch-row-item">
                                            <div class="switch-row-text">
                                                <span class="switch-row-title">Pedidos para llevar quedan en estado pendiente</span>
                                                <span class="switch-row-desc">Mantiene el pedido visible en la lista de preparación antes de ser despachado.</span>
                                            </div>
                                            <n-switch :disabled="!editMode" v-model:value="businessSettings.order.pending_takeaway" />
                                        </div>

                                        <div class="switch-row-item">
                                            <div class="switch-row-text">
                                                <span class="switch-row-title">Seleccionar usuario/mozo al tomar orden</span>
                                                <span class="switch-row-desc">Exige confirmar quién atiende la mesa al registrar nuevos platos.</span>
                                            </div>
                                            <n-switch :disabled="!editMode" v-model:value="businessSettings.order.select_order_user" />
                                        </div>

                                        <div class="switch-row-item">
                                            <div class="switch-row-text">
                                                <span class="switch-row-title">Mostrar total monetario en pantalla de mesa</span>
                                                <span class="switch-row-desc">Muestra el monto acumulado en la tarjeta de la mesa en tiempo real.</span>
                                            </div>
                                            <n-switch :disabled="!editMode" v-model:value="businessSettings.order.table_order_total" />
                                        </div>

                                        <div class="switch-row-item">
                                            <div class="switch-row-text">
                                                <span class="switch-row-title">Motivo de anulación de pedido obligatorio</span>
                                                <span class="switch-row-desc">Requiere sustento al cancelar un plato o comanda dentro de la mesa.</span>
                                            </div>
                                            <n-switch :disabled="!editMode" v-model:value="businessSettings.order.required_null_reason" />
                                        </div>

                                        <div class="switch-row-item">
                                            <div class="switch-row-text">
                                                <span class="switch-row-title">Imprimir categoría en ticket de pedido</span>
                                                <span class="switch-row-desc">Incluye el nombre de la sección (ej. Entradas, Fondos) en la comanda.</span>
                                            </div>
                                            <n-switch :disabled="!editMode" v-model:value="businessSettings.order.print_category_on_order" />
                                        </div>

                                        <div class="switch-row-item">
                                            <div class="switch-row-text">
                                                <span class="switch-row-title">Imprimir nombre del Área en ticket</span>
                                                <span class="switch-row-desc">Indica en la cabecera si el pedido proviene de Terraza, Salón, Barra, etc.</span>
                                            </div>
                                            <n-switch :disabled="!editMode" v-model:value="businessSettings.order.print_area_on_order" />
                                        </div>
                                    </div>
                                </n-form>
                            </n-card>
                        </div>

                        <!-- Card 2: Visual de Categorías en Carta -->
                        <div class="settings-card-group mt-4" v-if="businessSettings.category">
                            <div class="card-group-header">
                                <div class="card-header-icon category-bg"><v-icon name="md-gridview-round" /></div>
                                <div>
                                    <h3 class="group-title">Visualización de Categorías y Catálogo</h3>
                                    <p class="group-desc">Ajusta el tamaño y proporciones visuales de la carta interactiva de mozos y autoservicio.</p>
                                </div>
                            </div>

                            <n-card class="settings-inner-card" :bordered="true">
                                <n-form :disabled="!editMode" label-placement="top">
                                    <n-grid responsive="screen" cols="1 s:2 m:2 l:4" :x-gap="20" :y-gap="14">
                                        <n-form-item-gi label="Tamaño Tarjeta de Categoría">
                                            <n-select v-model:value="businessSettings.category.category_card_size" :options="categorySizeOptions" size="large" />
                                        </n-form-item-gi>
                                        <n-form-item-gi label="Tamaño Letra Categoría">
                                            <n-input-number v-model:value="businessSettings.category.area_text_size" placeholder="16" size="large" />
                                        </n-form-item-gi>
                                        <n-form-item-gi label="Ancho Imagen Producto (px)">
                                            <n-input-number v-model:value="businessSettings.category.width_image_product" placeholder="40" size="large" />
                                        </n-form-item-gi>
                                        <n-form-item-gi label="Alto Imagen Producto (px)">
                                            <n-input-number v-model:value="businessSettings.category.height_image_product" placeholder="40" size="large" />
                                        </n-form-item-gi>
                                    </n-grid>

                                    <div class="clean-switch-grid border-top pt-3 mt-3">
                                        <div class="switch-row-item">
                                            <div class="switch-row-text">
                                                <span class="switch-row-title">Usar imagen por defecto si la categoría no tiene foto</span>
                                                <span class="switch-row-desc">Muestra un icono gastronómico en lugar de dejar el espacio en blanco.</span>
                                            </div>
                                            <n-switch :disabled="!editMode" v-model:value="businessSettings.category.use_image" />
                                        </div>
                                    </div>
                                </n-form>
                            </n-card>
                        </div>
                    </div>
                </n-tab-pane>

                <!-- 5. PESTAÑA: REPORTES Y NOTIFICACIONES -->
                <n-tab-pane name="reportes">
                    <template #tab>
                        <div class="tab-label-item">
                            <div class="tab-icon-wrapper report-color">
                                <v-icon name="md-insertchart-outlined" />
                            </div>
                            <div class="tab-label-text">
                                <span class="tab-main-title">Reportes Automáticos</span>
                                <small class="tab-sub-title">Cierres de caja y correos</small>
                            </div>
                        </div>
                    </template>

                    <div class="tab-content-wrapper" v-if="businessSettings && businessSettings.reports">
                        <div class="settings-card-group">
                            <div class="card-group-header">
                                <div class="card-header-icon report-bg"><v-icon name="md-insertchart-outlined" /></div>
                                <div>
                                    <h3 class="group-title">Envío Automático de Cierres de Caja</h3>
                                    <p class="group-desc">Configura los correos electrónicos que recibirán el reporte financiero cada vez que se realice un cierre de caja.</p>
                                </div>
                            </div>

                            <n-card class="settings-inner-card" :bordered="true">
                                <n-form :disabled="!editMode" label-placement="top">
                                    <n-form-item label="Correos Electrónicos Destinatarios">
                                        <n-select 
                                            v-model:value="businessSettings.reports.report_emails" 
                                            filterable 
                                            multiple 
                                            tag 
                                            placeholder="Escribe un correo (ej: admin@flizzy.pe) y presiona Enter..." 
                                            size="large"
                                        />
                                        <template #feedback>Puedes añadir varios correos; se enviará el informe consolidado a todos ellos.</template>
                                    </n-form-item>

                                    <div class="clean-switch-grid border-top pt-3 mt-3">
                                        <div class="switch-row-item">
                                            <div class="switch-row-text">
                                                <span class="switch-row-title">Auto envío al Cierre de Caja</span>
                                                <span class="switch-row-desc">Despacha automáticamente el resumen en PDF al presionar Cerrar Caja.</span>
                                            </div>
                                            <n-switch :disabled="!editMode" v-model:value="businessSettings.reports.auto_send_mail" />
                                        </div>
                                    </div>
                                </n-form>
                            </n-card>
                        </div>
                    </div>
                </n-tab-pane>

                <!-- 6. PESTAÑA: MÓDULOS DEL SISTEMA -->
                <n-tab-pane name="modulos">
                    <template #tab>
                        <div class="tab-label-item">
                            <div class="tab-icon-wrapper module-color">
                                <v-icon name="md-viewcarousel-twotone" />
                            </div>
                            <div class="tab-label-text">
                                <span class="tab-main-title">Módulos Activos</span>
                                <small class="tab-sub-title">Menú lateral y navegación</small>
                            </div>
                        </div>
                    </template>

                    <div class="tab-content-wrapper" v-if="businessSettings.modules">
                        <div class="settings-card-group">
                            <div class="card-group-header">
                                <div class="card-header-icon module-bg"><v-icon name="md-viewcarousel-twotone" /></div>
                                <div>
                                    <h3 class="group-title">Visibilidad de Secciones en la Barra Lateral</h3>
                                    <p class="group-desc">Enciende o apaga módulos según la operativa particular de tu restaurante o restobar.</p>
                                </div>
                            </div>

                            <n-card class="settings-inner-card" :bordered="true">
                                <n-grid responsive="screen" cols="1 s:1 m:2 l:2" :x-gap="32">
                                    <n-grid-item>
                                        <div class="clean-switch-grid">
                                            <div class="switch-row-item">
                                                <div class="switch-row-text"><span class="switch-row-title">Caja y Turnos</span></div>
                                                <n-switch :disabled="!editMode" v-model:value="businessSettings.modules.show_till" />
                                            </div>
                                            <div class="switch-row-item">
                                                <div class="switch-row-text"><span class="switch-row-title">Mesas y Salón</span></div>
                                                <n-switch :disabled="!editMode" v-model:value="businessSettings.modules.show_tables" />
                                            </div>
                                            <div class="switch-row-item">
                                                <div class="switch-row-text"><span class="switch-row-title">Pedidos y Comandas</span></div>
                                                <n-switch :disabled="!editMode" v-model:value="businessSettings.modules.show_orders" />
                                            </div>
                                            <div class="switch-row-item">
                                                <div class="switch-row-text"><span class="switch-row-title">Ventas y Facturación</span></div>
                                                <n-switch :disabled="!editMode" v-model:value="businessSettings.modules.show_sales" />
                                            </div>
                                            <div class="switch-row-item">
                                                <div class="switch-row-text"><span class="switch-row-title">Anulaciones y Devoluciones</span></div>
                                                <n-switch :disabled="!editMode" v-model:value="businessSettings.modules.show_anulates" />
                                            </div>
                                            <div class="switch-row-item">
                                                <div class="switch-row-text"><span class="switch-row-title">Productos y Carta</span></div>
                                                <n-switch :disabled="!editMode" v-model:value="businessSettings.modules.show_products" />
                                            </div>
                                            <div class="switch-row-item">
                                                <div class="switch-row-text"><span class="switch-row-title">Pantalla de Cocina (KDS)</span></div>
                                                <n-switch 
                                                    :disabled="!editMode" 
                                                    v-model:value="businessSettings.modules.show_kds" 
                                                    @update:value="(val) => { if (businessSettings.kds) businessSettings.kds.enabled = val; }" 
                                                />
                                            </div>
                                            <div class="switch-row-item">
                                                <div class="switch-row-text"><span class="switch-row-title">Reportes y Estadísticas</span></div>
                                                <n-switch :disabled="!editMode" v-model:value="businessSettings.modules.show_reports" />
                                            </div>
                                        </div>
                                    </n-grid-item>

                                    <n-grid-item>
                                        <div class="clean-switch-grid">
                                            <div class="switch-row-item">
                                                <div class="switch-row-text"><span class="switch-row-title">Menús Gastronómicos</span></div>
                                                <n-switch :disabled="!editMode" v-model:value="businessSettings.modules.show_menus" />
                                            </div>
                                            <div class="switch-row-item">
                                                <div class="switch-row-text"><span class="switch-row-title">Combos y Promociones</span></div>
                                                <n-switch :disabled="!editMode" v-model:value="businessSettings.modules.show_combos" />
                                            </div>
                                            <div class="switch-row-item">
                                                <div class="switch-row-text"><span class="switch-row-title">Proveedores</span></div>
                                                <n-switch :disabled="!editMode" v-model:value="businessSettings.modules.show_suppliers" />
                                            </div>
                                            <div class="switch-row-item">
                                                <div class="switch-row-text"><span class="switch-row-title">Insumos y Recetas</span></div>
                                                <n-switch :disabled="!editMode" v-model:value="businessSettings.modules.show_supplies" />
                                            </div>
                                            <div class="switch-row-item">
                                                <div class="switch-row-text"><span class="switch-row-title">Control de Kardex / Almacén</span></div>
                                                <n-switch :disabled="!editMode" v-model:value="businessSettings.modules.show_kardex" />
                                            </div>
                                            <div class="switch-row-item">
                                                <div class="switch-row-text"><span class="switch-row-title">Cartera de Clientes</span></div>
                                                <n-switch :disabled="!editMode" v-model:value="businessSettings.modules.show_customers" />
                                            </div>
                                            <div class="switch-row-item">
                                                <div class="switch-row-text"><span class="switch-row-title">Gestión de Cumpleaños</span></div>
                                                <n-switch :disabled="!editMode" v-model:value="businessSettings.modules.show_birthdays" />
                                            </div>
                                        </div>
                                    </n-grid-item>
                                </n-grid>
                            </n-card>
                        </div>
                    </div>
                </n-tab-pane>

                <!-- 7. PESTAÑA: COCINA / KDS -->
                <n-tab-pane name="kds">
                    <template #tab>
                        <div class="tab-label-item">
                            <div class="tab-icon-wrapper kds-color">
                                <v-icon name="md-kitchen-twotone" />
                            </div>
                            <div class="tab-label-text">
                                <span class="tab-main-title">Cocina / KDS</span>
                                <small class="tab-sub-title">Pantalla digital y tiempos</small>
                            </div>
                        </div>
                    </template>

                    <div class="tab-content-wrapper" v-if="businessSettings && businessSettings.kds">
                        <div class="settings-card-group">
                            <div class="card-group-header">
                                <div class="card-header-icon kds-bg"><v-icon name="md-kitchen-twotone" /></div>
                                <div>
                                    <h3 class="group-title">Sistema de Pantalla de Cocina (KDS)</h3>
                                    <p class="group-desc">Organiza los tiempos de preparación en cocina sin requerir papel impreso.</p>
                                </div>
                            </div>

                            <n-card class="settings-inner-card" :bordered="true">
                                <n-form :disabled="!editMode" label-placement="top">
                                    <div class="clean-switch-grid mb-4">
                                        <div class="switch-row-item">
                                            <div class="switch-row-text">
                                                <span class="switch-row-title">Habilitar módulo KDS interactivo</span>
                                                <span class="switch-row-desc">Permite a cocina marcar pedidos como Preparando y Despachado.</span>
                                            </div>
                                            <n-switch 
                                                :disabled="!editMode" 
                                                v-model:value="businessSettings.kds.enabled" 
                                                @update:value="(val) => { if (businessSettings.modules) businessSettings.modules.show_kds = val; }" 
                                            />
                                        </div>
                                    </div>

                                    <n-grid responsive="screen" cols="1 s:2 m:2 l:4" :x-gap="20" :y-gap="14">
                                        <n-form-item-gi label="Tema Visual KDS">
                                            <n-select 
                                                v-model:value="businessSettings.kds.theme" 
                                                :options="kdsThemeOptions" 
                                                size="large"
                                                @update:value="onKdsThemeChange"
                                            />
                                        </n-form-item-gi>
                                        <n-form-item-gi label="Alerta de Demora Amarilla (Min)">
                                            <n-input-number v-model:value="businessSettings.kds.alert_warning_min" :min="1" :max="60" size="large" />
                                        </n-form-item-gi>
                                        <n-form-item-gi label="Alerta de Demora Crítica Roja (Min)">
                                            <n-input-number v-model:value="businessSettings.kds.alert_critical_min" :min="2" :max="120" size="large" />
                                        </n-form-item-gi>
                                        <n-form-item-gi label="Auto-Recarga de Pantalla (Seg)">
                                            <n-input-number v-model:value="businessSettings.kds.refresh_interval" :min="2" :max="30" size="large" />
                                        </n-form-item-gi>
                                    </n-grid>

                                    <div class="sub-section-title mt-4">Notificaciones y Alertas Sonoras de Cocina</div>
                                    <div class="clean-switch-grid mt-2">
                                        <div class="switch-row-item">
                                            <div class="switch-row-text">
                                                <span class="switch-row-title">Sonido al recibir nueva comanda</span>
                                                <span class="switch-row-desc">Emite campana en los parlantes de cocina cuando entra un nuevo pedido.</span>
                                            </div>
                                            <n-switch :disabled="!editMode" v-model:value="businessSettings.kds.sound_new_order" />
                                        </div>

                                        <div class="switch-row-item">
                                            <div class="switch-row-text">
                                                <span class="switch-row-title">Alerta sonora por demora crítica</span>
                                                <span class="switch-row-desc">Avisa acústicamente cuando una comanda supera el tiempo límite rojo.</span>
                                            </div>
                                            <n-switch :disabled="!editMode" v-model:value="businessSettings.kds.sound_delayed_order" />
                                        </div>

                                        <div class="switch-row-item">
                                            <div class="switch-row-text">
                                                <span class="switch-row-title">Probar timbre de campana</span>
                                                <span class="switch-row-desc">Haz clic para comprobar el volumen y salida de audio en este terminal.</span>
                                            </div>
                                            <n-button secondary type="info" size="medium" @click="testChimeSound">
                                                🔔 Probar Timbre
                                            </n-button>
                                        </div>
                                    </div>
                                </n-form>
                            </n-card>
                        </div>
                    </div>
                </n-tab-pane>

                <!-- 8. PESTAÑA: WHATSAPP -->
                <n-tab-pane name="whatsapp">
                    <template #tab>
                        <div class="tab-label-item">
                            <div class="tab-icon-wrapper whatsapp-color">
                                <v-icon name="bi-whatsapp" />
                            </div>
                            <div class="tab-label-text">
                                <span class="tab-main-title">WhatsApp</span>
                                <small class="tab-sub-title">Vinculación y mensajes</small>
                            </div>
                        </div>
                    </template>

                    <div class="tab-content-wrapper">
                        <div class="settings-card-group">
                            <div class="card-group-header">
                                <div class="card-header-icon whatsapp-bg"><v-icon name="bi-whatsapp" /></div>
                                <div>
                                    <h3 class="group-title">Vinculación de WhatsApp del Restaurante</h3>
                                    <p class="group-desc">Envía comprobantes de pago, cuentas y notificaciones a tus clientes desde tu propio número celular.</p>
                                </div>
                            </div>

                            <n-card class="settings-inner-card" :bordered="true">
                                <div class="d-flex justify-content-between align-items-center flex-wrap gap-3 p-2">
                                    <div class="d-flex align-items-center gap-3">
                                        <div class="whatsapp-avatar-badge" :class="{ connected: whatsappStatus.is_ready }">
                                            <v-icon name="bi-whatsapp" scale="2" />
                                        </div>
                                        <div>
                                            <div class="d-flex align-items-center gap-2">
                                                <n-tag :type="whatsappStatus.is_ready ? 'success' : 'default'" round size="medium">
                                                    {{ whatsappStatus.is_ready ? 'Dispositivo Conectado' : 'Sin Dispositivo Vinculado' }}
                                                </n-tag>
                                                <span v-if="whatsappStatus.phone_number" class="fw-bold fs-6 ms-2">
                                                    +{{ whatsappStatus.phone_number }}
                                                </span>
                                            </div>
                                            <n-text depth="3" class="fs-7 d-block mt-1">
                                                {{ whatsappStatus.is_ready ? 'Los comprobantes se enviarán directamente desde tu línea telefónica.' : 'Actualmente se utiliza el servicio predeterminado del sistema (Emiteca).' }}
                                            </n-text>
                                        </div>
                                    </div>

                                    <div class="d-flex gap-2">
                                        <n-button
                                            v-if="!whatsappStatus.is_ready"
                                            type="success"
                                            size="large"
                                            @click="showWhatsAppModal = true"
                                        >
                                            <template #icon><v-icon name="bi-qr-code-scan" /></template>
                                            Escanear Código QR
                                        </n-button>
                                        <n-button
                                            v-else
                                            type="error"
                                            secondary
                                            size="large"
                                            :loading="loadingLogout"
                                            @click="handleLogoutWhatsApp"
                                        >
                                            <template #icon><v-icon name="md-linkoff" /></template>
                                            Desvincular WhatsApp
                                        </n-button>
                                    </div>
                                </div>

                                <n-alert type="info" :show-icon="true" class="mt-4">
                                    <strong>Respaldo Automático:</strong> Si tu celular se queda sin batería o sin señal, el sistema enviará los comprobantes automáticamente a través del canal alternativo sin interrumpir tus ventas.
                                </n-alert>
                            </n-card>
                        </div>
                    </div>
                </n-tab-pane>

                <!-- 9. PESTAÑA: INTEGRACIONES Y API -->
                <n-tab-pane name="integraciones">
                    <template #tab>
                        <div class="tab-label-item">
                            <div class="tab-icon-wrapper api-color">
                                <v-icon name="gi-settings-knobs" />
                            </div>
                            <div class="tab-label-text">
                                <span class="tab-main-title">Integraciones</span>
                                <small class="tab-sub-title">API Token y externas</small>
                            </div>
                        </div>
                    </template>

                    <div class="tab-content-wrapper" v-if="businessSettings.customers">
                        <div class="settings-card-group">
                            <div class="card-group-header">
                                <div class="card-header-icon api-bg"><v-icon name="gi-settings-knobs" /></div>
                                <div>
                                    <h3 class="group-title">Integraciones Externas y API Tokens</h3>
                                    <p class="group-desc">Tokens de seguridad para consultas directas de DNI / RUC y enlaces con plataformas externas.</p>
                                </div>
                            </div>

                            <n-card class="settings-inner-card" :bordered="true">
                                <n-form :disabled="!editMode" label-placement="top">
                                    <n-form-item label="Token API de Consultas SUNAT / Reniec (Bearer Token)">
                                        <n-input 
                                            type="textarea" 
                                            v-model:value="businessSettings.customers.api_token" 
                                            rows="3" 
                                            placeholder="Ingresa tu Bearer Token para consultas automáticas..." 
                                            size="large"
                                        />
                                        <template #feedback>Utilizado en la búsqueda automática de datos fiscales de clientes.</template>
                                    </n-form-item>
                                </n-form>
                            </n-card>
                        </div>
                    </div>
                </n-tab-pane>

            </n-tabs>
        </div>

        <!-- Modal QR WhatsApp -->
        <WhatsAppQrModal v-model:show="showWhatsAppModal" @linked="onWhatsAppLinked" />
    </div>
</template>

<script>
import { defineComponent, ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useMessage } from "naive-ui";
import { useRouter, useRoute } from "vue-router";
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
        const route = useRoute();
        const message = useMessage();
        const printerStore = usePrinterStore();
        const productStore = useProductStore();
        const settingsStore = useSettingsStore();

        const activeTab = ref(route.query?.tab || "impresiones");
        const editMode = ref(false);
        const saving = ref(false);
        const searchQuery = ref("");

        watch(
            () => route.query?.tab,
            (newTab) => {
                if (newTab) {
                    activeTab.value = newTab;
                }
            }
        );

        watch(activeTab, () => {
            const pane = document.querySelector(".settings-tabs .n-tab-pane");
            if (pane) {
                pane.scrollTop = 0;
            }
        });

        const businessSettings = ref(cloneDeep(settingsStore.businessSettings));

        // Inicializadores de seguridad para asegurar que ningún objeto esté undefined
        const initModules = (settings) => {
            if (!settings) return;
            if (!settings.modules) settings.modules = {};
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
                show_kds: false,
            };
            for (const key in defaultModules) {
                if (settings.modules[key] === undefined) {
                    settings.modules[key] = defaultModules[key];
                }
            }
        };

        const initKdsSettings = (settings) => {
            if (!settings) return;
            if (!settings.kds) settings.kds = {};
            const defaultKds = {
                enabled: true,
                theme: 'dark',
                alert_warning_min: 8,
                alert_critical_min: 15,
                sound_new_order: true,
                sound_delayed_order: true,
                refresh_interval: 4,
            };
            for (const key in defaultKds) {
                if (settings.kds[key] === undefined) {
                    settings.kds[key] = defaultKds[key];
                }
            }
        };

        const initCategorySettings = (settings) => {
            if (!settings) return;
            if (!settings.category) settings.category = {};
            if (!settings.category.category_card_size) settings.category.category_card_size = 'medium';
            if (!settings.category.category_card_height) settings.category.category_card_height = 120;
            if (settings.category.area_text_size === undefined) settings.category.area_text_size = 21;
            if (settings.category.width_image_product === undefined) settings.category.width_image_product = 40;
            if (settings.category.height_image_product === undefined) settings.category.height_image_product = 40;
            if (settings.category.use_image === undefined) settings.category.use_image = true;
        };

        const initPrinterSettings = (settings) => {
            if (!settings) return;
            if (!settings.printer) settings.printer = {};
            if (!Array.isArray(settings.printer.margins) || settings.printer.margins.length < 4) {
                settings.printer.margins = [0, 0, 0, 0];
            }
            const defaultPrinter = {
                header_font_size: 18,
                sub_header_font_size: 16,
                body_font_size: 14,
                footer_font_size: 14,
                delivery_ticket_font_size: 12,
                pre_account_ticket_font_size: 12,
                show_cat: false,
                print_delivery_ticket: true,
                auto_print_cancellation: false,
                auto_print_table_cancellation: false,
                detail_items: true,
                show_delivery_kitchen: true,
                show_both_names: false,
                native_printing: false,
                print_html: true,
                manage_fittings: false,
                subticket_mode: false,
                extra_text: false,
                show_product_price: false,
                info_location: 'footer',
                invoice_printer_format: 80,
                kitchen_printer_format: 58,
                kitchen_ticket_format: 4,
                print_name_take_away: '',
                print_name_delivery: ''
            };
            for (const key in defaultPrinter) {
                if (settings.printer[key] === undefined) {
                    settings.printer[key] = defaultPrinter[key];
                }
            }
        };

        const initSaleSettings = (settings) => {
            if (!settings) return;
            if (!settings.sale) settings.sale = {};
            const defaultSale = {
                printer_name: 'CAJA',
                auto_print: false,
                default_invoice: 80,
                default_affectation: 20,
                icbper_tax: '0.4',
                igv_tax: 0.18,
                auto_send: true,
                show_discount_label: true,
                required_null_reason: false,
                require_user_pass_to_null: false,
                require_general_pass_to_null: true,
                require_pass_recovery: false,
                manage_affectations: false,
                show_preview: true,
                show_amazon_legend: false,
                enable_invoices: true,
                enable_credits: true,
                customer_credits: false,
                free_sale: true,
                free_sale_deduct_stock_default: false,
                free_sale_affects_till: true,
                free_sale_send_doc: true,
            };
            for (const key in defaultSale) {
                if (settings.sale[key] === undefined) {
                    settings.sale[key] = defaultSale[key];
                }
            }
        };

        const initTillSettings = (settings) => {
            if (!settings) return;
            if (!settings.till) settings.till = {};
            if (settings.till.closure_cash_total === undefined) settings.till.closure_cash_total = false;
            if (settings.till.delivery_affects_till === undefined) settings.till.delivery_affects_till = true;
        };

        const initOrderSettings = (settings) => {
            if (!settings) return;
            if (!settings.order) settings.order = {};
            const defaultOrder = {
                default_filters: ['M', 'P', 'D'],
                waiter_auth_mode: 'default',
                fast_sale_format: false,
                divide_delivery_takeaway: true,
                order_by_customer: false,
                order_customer_name: false,
                pending_takeaway: false,
                select_order_user: false,
                table_order_total: true,
                required_null_reason: false,
                print_category_on_order: false,
                print_area_on_order: false,
            };
            for (const key in defaultOrder) {
                if (settings.order[key] === undefined) {
                    settings.order[key] = defaultOrder[key];
                }
            }
        };

        const initReportsSettings = (settings) => {
            if (!settings) return;
            if (!settings.reports) settings.reports = {};
            if (!Array.isArray(settings.reports.report_emails)) settings.reports.report_emails = [];
            if (settings.reports.auto_send_mail === undefined) settings.reports.auto_send_mail = false;
        };

        const initCustomersSettings = (settings) => {
            if (!settings) return;
            if (!settings.customers) settings.customers = {};
            if (settings.customers.api_token === undefined) settings.customers.api_token = '';
        };

        const applyAllInits = (s) => {
            if (!s) return;
            initModules(s);
            initKdsSettings(s);
            initCategorySettings(s);
            initPrinterSettings(s);
            initSaleSettings(s);
            initTillSettings(s);
            initOrderSettings(s);
            initReportsSettings(s);
            initCustomersSettings(s);
        };

        applyAllInits(businessSettings.value);

        watch(() => settingsStore.businessSettings, (newVal) => {
            if (newVal && Object.keys(newVal).length > 0 && !editMode.value) {
                businessSettings.value = cloneDeep(newVal);
                applyAllInits(businessSettings.value);
            }
        }, { deep: true });

        // Opciones de Configuración
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
            { label: "80 mm (Ticketera Estándar)", value: 80 },
            { label: "58 mm (Ticketera Compacta)", value: 58 }
        ];

        const invoiceOptions = [
            { label: "BOLETA ELECTRÓNICA (03)", value: 3 },
            { label: "FACTURA ELECTRÓNICA (01)", value: 1 },
            { label: "NOTA DE VENTA (80)", value: 80 }
        ];

        const kitchenPrinterFormatOptions = [
            { label: "FORMATO 1 (Compacto Clásico)", value: 1 },
            { label: "FORMATO 2 (Estándar Destacado)", value: 2 },
            { label: "FORMATO 3 (Con Líneas Divisorias)", value: 3 },
            { label: "FORMATO 4 (Moderno Gastronómico)", value: 4 }
        ];

        const infoLocationOptions = [
            { label: "Pie de página (Recomendado)", value: "footer" },
            { label: "Cabecera", value: "header" }
        ];

        const orderTypeOptions = [
            { value: "M", label: "MESA" },
            { value: "P", label: "PARA LLEVAR" },
            { value: "D", label: "DELIVERY" }
        ];

        const waiterAuthModeOptions = [
            { value: "default", label: "Mozo Predeterminado (Quien inició sesión)" },
            { value: "select", label: "Seleccionar responsable de una lista en pantalla" },
            { value: "pin", label: "Ingresar código de usuario / PIN del responsable" }
        ];

        const kdsThemeOptions = [
            { label: "Negro (Oscuro Industrial - Recomendado)", value: "dark" },
            { label: "Blanco (Claro Nórdico)", value: "light" }
        ];

        const categorySizeOptions = [
            { label: "Pequeño (Compacto - Más categorías visibles)", value: "small" },
            { label: "Mediano (Equilibrado - Estándar)", value: "medium" },
            { label: "Grande (Amplio - Fácil pulsación táctil)", value: "large" }
        ];

        // Catálogo de búsqueda rápida
        const settingsDirectory = [
            { key: "kuzeta", title: "Motor Kuzeta & Ticketeras", tab: "impresiones", tabName: "Impresión y Tickets", icon: "md-print-round", keywords: "kuzeta websocket host precuenta comanda" },
            { key: "formato_caja", title: "Formato de Papel (80mm / 58mm)", tab: "impresiones", tabName: "Impresión y Tickets", icon: "md-print-round", keywords: "papel 80 58 tamaño formato" },
            { key: "fuentes", title: "Tamaños de Letra", tab: "impresiones", tabName: "Impresión y Tickets", icon: "md-print-round", keywords: "fuente letra tamaño cabecera" },
            { key: "margenes", title: "Márgenes de Impresión", tab: "impresiones", tabName: "Impresión y Tickets", icon: "md-print-round", keywords: "margenes superior izquierdo" },
            { key: "igv", title: "Tasa de IGV (18% / 10.5% / 0%)", tab: "ventas", tabName: "Ventas y Facturación", icon: "md-pointofsale-twotone", keywords: "igv impuesto tasa mype sunat" },
            { key: "doc_defecto", title: "Documento por Defecto", tab: "ventas", tabName: "Ventas y Facturación", icon: "md-pointofsale-twotone", keywords: "boleta factura nota de venta comprobante" },
            { key: "claves", title: "Claves de Seguridad para Anular", tab: "ventas", tabName: "Ventas y Facturación", icon: "md-lock-round", keywords: "clave password anular contraseña seguridad" },
            { key: "auto_print", title: "Impresión Automática de Ventas", tab: "ventas", tabName: "Ventas y Facturación", icon: "md-pointofsale-twotone", keywords: "impresion automatica comprobante cobrar" },
            { key: "auto_send", title: "Auto Envío SUNAT (CPE)", tab: "ventas", tabName: "Ventas y Facturación", icon: "md-pointofsale-twotone", keywords: "sunat cpe auto envio xml" },
            { key: "creditos", title: "Ventas a Crédito", tab: "ventas", tabName: "Ventas y Facturación", icon: "md-pointofsale-twotone", keywords: "credito cuenta cobrar cliente" },
            { key: "caja_arqueo", title: "Arqueo Obligatorio al Cerrar Caja", tab: "caja", tabName: "Gestión de Caja", icon: "bi-cash-stack", keywords: "caja arqueo ciego cierre efectivo" },
            { key: "mozos", title: "Autenticación de Mozos", tab: "pedidos", tabName: "Pedidos y Carta", icon: "md-dining-twotone", keywords: "mozo pin password responsable" },
            { key: "correos", title: "Correos para Cierre de Caja", tab: "reportes", tabName: "Reportes Automáticos", icon: "md-insertchart-outlined", keywords: "correo email reporte auto envio caja" },
            { key: "modulos_sidebar", title: "Encender / Apagar Módulos", tab: "modulos", tabName: "Módulos Activos", icon: "md-viewcarousel-twotone", keywords: "modulo sidebar menu kds combos kardex" },
            { key: "kds_cocina", title: "Pantalla KDS de Cocina", tab: "kds", tabName: "Cocina / KDS", icon: "md-kitchen-twotone", keywords: "kds cocina sonido timbre campana pantalla" },
            { key: "whatsapp", title: "Vinculación con WhatsApp", tab: "whatsapp", tabName: "WhatsApp", icon: "bi-whatsapp", keywords: "whatsapp qr zendy emiteca celular" },
            { key: "api_token", title: "Token API Clientes", tab: "integraciones", tabName: "Integraciones", icon: "gi-settings-knobs", keywords: "api token bearer reniec sunat consulta" }
        ];

        const searchMatches = computed(() => {
            if (!searchQuery.value || !searchQuery.value.trim()) return [];
            const q = searchQuery.value.toLowerCase().trim();
            return settingsDirectory.filter(item => 
                item.title.toLowerCase().includes(q) ||
                item.keywords.toLowerCase().includes(q) ||
                item.tabName.toLowerCase().includes(q)
            );
        });

        const jumpToTab = (tabName) => {
            activeTab.value = tabName;
            searchQuery.value = "";
            setTimeout(() => {
                const pane = document.querySelector(".settings-tabs .n-tab-pane");
                if (pane) {
                    pane.scrollTop = 0;
                }
            }, 50);
        };

        const onKdsThemeChange = (val) => {
            if (val) localStorage.setItem('kds_theme', val);
        };

        const testChimeSound = () => {
            try {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (!AudioCtx) {
                    message.warning("Tu navegador no soporta Web Audio API");
                    return;
                }
                const ctx = new AudioCtx();
                if (ctx.state === 'suspended') ctx.resume();
                const now = ctx.currentTime;
                const playTone = (freq, startTime, duration, vol) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, startTime);
                    gain.gain.setValueAtTime(vol, startTime);
                    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(startTime);
                    osc.stop(startTime + duration);
                };
                playTone(1046.50, now, 0.5, 0.4);
                playTone(1318.51, now + 0.12, 0.7, 0.35);
                playTone(1567.98, now + 0.25, 0.9, 0.3);
                message.info("🔔 Sonido de campana reproducido correctamente.");
            } catch (e) {
                console.error("Audio error:", e);
                message.error("Error al reproducir audio: " + e.message);
            }
        };

        const performUpdateBusinessSettings = async () => {
            saving.value = true;
            try {
                if (businessSettings.value.kds && businessSettings.value.modules) {
                    businessSettings.value.kds.enabled = businessSettings.value.modules.show_kds;
                }
                const response = await updateBusinessSettings(businessSettings.value);
                if (response.status === 202 || response.status === 200) {
                    message.success("Configuración actualizada correctamente.");
                    settingsStore.business_settings = response.data;
                    if (businessSettings.value.kds && businessSettings.value.kds.theme) {
                        localStorage.setItem('kds_theme', businessSettings.value.kds.theme);
                    }
                    editMode.value = false;
                }
            } catch (error) {
                console.error("Error saving business settings:", error);
                message.error("Error al guardar la configuración.");
            } finally {
                saving.value = false;
            }
        };

        const handleBack = () => {
            router.push({ name: "HomeSettings" });
        };

        const resetSettings = () => {
            businessSettings.value = cloneDeep(settingsStore.businessSettings);
            applyAllInits(businessSettings.value);
            editMode.value = false;
            message.info("Cambios cancelados.");
        };

        // Estado WhatsApp
        const showWhatsAppModal = ref(false);
        const loadingLogout = ref(false);
        const whatsappStatus = ref({
            state: "disconnected",
            phone_number: null,
            is_ready: false
        });

        const fetchWhatsAppStatus = async (silent = false) => {
            try {
                const res = await getWhatsAppStatus();
                if (res.data) {
                    whatsappStatus.value = {
                        state: res.data.state || "disconnected",
                        phone_number: res.data.phone_number || null,
                        is_ready: res.data.is_ready || false
                    };
                }
            } catch (err) {
                if (!silent) console.error("Error al obtener estado de WhatsApp:", err);
            }
        };

        const handleLogoutWhatsApp = async () => {
            loadingLogout.value = true;
            try {
                const res = await logoutWhatsApp();
                if (res.data?.success) {
                    message.success(res.data.message || "WhatsApp desvinculado");
                    whatsappStatus.value = { state: "disconnected", phone_number: null, is_ready: false };
                } else {
                    message.error(res.data?.error || "Error al desvincular");
                }
            } catch (err) {
                message.error("Error al comunicarse con el servidor");
            } finally {
                loadingLogout.value = false;
            }
        };

        const onWhatsAppLinked = (data) => {
            whatsappStatus.value = { state: "connected", phone_number: data.phone_number, is_ready: true };
            message.success("¡WhatsApp vinculado exitosamente!");
        };

        const handleWhatsAppStatusEvent = (e) => {
            if (e.detail) {
                whatsappStatus.value.is_ready = e.detail.is_ready;
                whatsappStatus.value.state = e.detail.state;
                if (e.detail.phone_number) {
                    whatsappStatus.value.phone_number = e.detail.phone_number;
                }
            } else {
                fetchWhatsAppStatus(true);
            }
        };

        onMounted(() => {
            window.addEventListener("whatsapp-status-changed", handleWhatsAppStatusEvent);
            fetchWhatsAppStatus(true);
        });

        onUnmounted(() => {
            window.removeEventListener("whatsapp-status-changed", handleWhatsAppStatusEvent);
        });

        return {
            activeTab,
            editMode,
            saving,
            searchQuery,
            searchMatches,
            jumpToTab,
            businessSettings,
            performUpdateBusinessSettings,
            resetSettings,
            handleBack,
            productStore,
            printerStore,
            current_igv_tax,
            igvOptions,
            printOptions,
            invoiceOptions,
            kitchenPrinterFormatOptions,
            infoLocationOptions,
            orderTypeOptions,
            waiterAuthModeOptions,
            kdsThemeOptions,
            categorySizeOptions,
            onKdsThemeChange,
            testChimeSound,
            showWhatsAppModal,
            loadingLogout,
            whatsappStatus,
            handleLogoutWhatsApp,
            onWhatsAppLinked
        };
    }
});
</script>

<style scoped lang="scss">
.settings-container {
    background-color: #ffffff;
    height: calc(100vh - 95px);
    max-height: calc(100vh - 95px);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

/* Header Fijo con diseño de panel SaaS */
.settings-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 24px;
    background: #ffffff;
    border-bottom: 1px solid #eef2f6;
    flex-shrink: 0;
    z-index: 10;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 12px;
}

.page-title {
    font-size: 20px;
    font-weight: 700;
    color: #1e293b;
    letter-spacing: -0.3px;
}

.page-subtitle {
    font-size: 13px;
    color: #64748b;
    margin-top: 2px;
}

.mode-tag {
    font-weight: 600;
    font-size: 11px;
}

.header-search {
    flex: 1;
    max-width: 360px;
    margin: 0 24px;
}

.search-input {
    border-radius: 20px;
}

.action-btn {
    border-radius: 8px;
    font-weight: 600;
}

.save-btn {
    box-shadow: 0 4px 12px rgba(24, 160, 88, 0.25);
}

/* Banner de búsqueda fijo bajo el header */
.search-results-banner {
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    padding: 10px 24px;
    flex-shrink: 0;
}

.search-chip {
    cursor: pointer;
    transition: all 0.2s ease;
    &:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
    }
}

/* Cuerpo dividido en dos paneles */
.settings-body {
    flex: 1;
    min-height: 0;
    display: flex;
    overflow: hidden;
    background: #ffffff;
}

.settings-tabs {
    width: 100%;
    height: 100%;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: row;
    overflow: hidden;

    /* Barra lateral de navegación de módulos (Izquierda - Estática) */
    :deep(.n-tabs-nav) {
        width: 260px;
        min-width: 260px;
        max-width: 260px;
        flex-shrink: 0;
        background: #f8fafc;
        border-right: 1px solid #e2e8f0;
        height: 100%;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 12px 10px;
        box-sizing: border-box;
    }

    :deep(.n-tabs-nav-scroll-wrapper) {
        height: 100%;
    }

    :deep(.n-tabs-nav-scroll-content) {
        border-right: none !important;
    }

    :deep(.n-tabs-wrapper) {
        width: 100%;
    }

    :deep(.n-tabs-tab-wrapper) {
        width: 100%;
    }

    :deep(.n-tabs-tab) {
        width: 100%;
        padding: 4px 6px !important;
        margin-bottom: 6px;
        border-radius: 8px;
        border: 1px solid transparent;
        transition: all 0.2s ease;
        box-sizing: border-box;

        &:hover {
            background-color: #f1f5f9;
        }

        &.n-tabs-tab--active {
            background-color: #ffffff;
            box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
            border-color: #e2e8f0;

            .tab-main-title {
                color: #0f172a;
                font-weight: 700;
            }
        }
    }

    :deep(.n-tabs-bar) {
        display: none !important;
    }

    /* Panel de contenido de configuraciones (Derecha - Scroll Independiente Total) */
    :deep(.n-tab-pane),
    :deep(.n-tabs-pane-wrapper) {
        flex: 1;
        min-width: 0;
        height: 100% !important;
        max-height: 100% !important;
        overflow-y: auto !important;
        overflow-x: hidden;
        background: #ffffff;
        scroll-behavior: smooth;
        box-sizing: border-box;
    }

    :deep(.n-tab-pane) {
        padding: 24px 32px 160px 32px !important;
    }

    :deep(.n-tab-pane)::-webkit-scrollbar {
        width: 8px;
    }

    :deep(.n-tab-pane)::-webkit-scrollbar-track {
        background: #f8fafc;
    }

    :deep(.n-tab-pane)::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 4px;
        &:hover {
            background: #94a3b8;
        }
    }
}

.tab-label-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 6px 4px;
    text-align: left;
    width: 100%;
}

.tab-icon-wrapper {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    transition: transform 0.2s;

    &.print-color { background: #e0f2fe; color: #0284c7; }
    &.sales-color { background: #dcfce7; color: #16a34a; }
    &.till-color { background: #fef3c7; color: #d97706; }
    &.order-color { background: #ffedd5; color: #ea580c; }
    &.report-color { background: #ede9fe; color: #7c3aed; }
    &.module-color { background: #e0e7ff; color: #4f46e5; }
    &.kds-color { background: #ffe4e6; color: #e11d48; }
    &.whatsapp-color { background: #dcfce7; color: #25d366; }
    &.api-color { background: #f1f5f9; color: #475569; }
}

.tab-label-text {
    display: flex;
    flex-direction: column;
}

.tab-main-title {
    font-size: 14px;
    font-weight: 600;
    color: #1e293b;
}

.tab-sub-title {
    font-size: 11px;
    color: #94a3b8;
}

/* Contenedores de Tarjetas por Grupo */
.tab-content-wrapper {
    width: 100%;
    animation: fadeIn 0.25s ease-out;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
}

.settings-card-group {
    margin-bottom: 24px;
}

.card-group-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
}

.card-header-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;

    &.print-bg { background: #e0f2fe; color: #0284c7; }
    &.format-bg { background: #ede9fe; color: #7c3aed; }
    &.font-bg { background: #f1f5f9; color: #475569; }
    &.rules-bg { background: #fef3c7; color: #d97706; }
    &.sales-bg { background: #dcfce7; color: #16a34a; }
    &.security-bg { background: #fee2e2; color: #dc2626; }
    &.free-bg { background: #ccfbf1; color: #0d9488; }
    &.till-bg { background: #fef3c7; color: #d97706; }
    &.order-bg { background: #ffedd5; color: #ea580c; }
    &.category-bg { background: #e0e7ff; color: #4f46e5; }
    &.report-bg { background: #ede9fe; color: #7c3aed; }
    &.module-bg { background: #e0e7ff; color: #4f46e5; }
    &.kds-bg { background: #ffe4e6; color: #e11d48; }
    &.whatsapp-bg { background: #dcfce7; color: #25d366; }
    &.api-bg { background: #f1f5f9; color: #475569; }
}

.group-title {
    font-size: 16px;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
    line-height: 1.3;
}

.group-desc {
    font-size: 13px;
    color: #64748b;
    margin: 2px 0 0 0;
}

.settings-inner-card {
    background-color: #ffffff;
    border-radius: 12px;
    border: 1px solid #eef2f6;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
    padding: 8px 12px;
}

.sub-section-title {
    font-size: 13px;
    font-weight: 700;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
}

/* Grilla limpia de Switches con fila explicativa */
.clean-switch-grid {
    display: flex;
    flex-direction: column;
}

.switch-row-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 14px;
    border-radius: 8px;
    transition: background-color 0.15s ease;
    border-bottom: 1px solid #f1f5f9;

    &:last-child {
        border-bottom: none;
    }

    &:hover {
        background-color: #f8fafc;
    }
}

.switch-row-text {
    display: flex;
    flex-direction: column;
    padding-right: 16px;
}

.switch-row-title {
    font-size: 14px;
    font-weight: 600;
    color: #334155;
}

.switch-row-desc {
    font-size: 12px;
    color: #64748b;
    margin-top: 2px;
    line-height: 1.4;
}

/* WhatsApp específico */
.whatsapp-avatar-badge {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: #f1f5f9;
    color: #94a3b8;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.25s ease;

    &.connected {
        background: #dcfce7;
        color: #25d366;
    }
}

.border-top {
    border-top: 1px solid #f1f5f9;
}
</style>
