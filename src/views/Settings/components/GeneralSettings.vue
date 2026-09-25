<template>
  <div id="GeneralSettings" class="general-settings-container">
    <!-- Header moderno y consistente -->
    <div class="settings-header">
      <div class="header-left">
        <n-button circle @click="handleBack" size="large" quaternary class="back-btn">
          <template #icon><v-icon name="md-arrowback-round" /></template>
        </n-button>
        <div>
          <n-h2 class="header-title">Configuración General</n-h2>
          <n-text depth="3" class="header-subtitle">
            Administra áreas, mesas, zonas de preparación, categorías, finanzas y kardex.
          </n-text>
        </div>
      </div>
    </div>

    <n-card class="settings-main-card" :bordered="false">
      <n-tabs v-model:value="activeTab" type="line" size="large" animated class="settings-tabs">
        
        <!-- 1. PESTAÑA: ÁREAS Y MESAS -->
        <n-tab-pane
          :disabled="
            !userStore.hasPermission('view_area') ||
            !userStore.hasPermission('view_table')
          "
          name="areas-tables"
          tab="Áreas y Mesas"
        >
          <div class="tab-pane-content" v-if="userStore.hasPermission('view_area') || userStore.hasPermission('view_table')">
            <n-grid responsive="screen" cols="1 m:1 l:2" :x-gap="20" :y-gap="20">
              
              <!-- Card 1: Configuración de Áreas -->
              <n-gi>
                <n-card title="Gestión de Áreas" size="small" class="settings-subcard" :bordered="true">
                  <template #header-extra>
                    <n-tag v-if="currentArea" type="info" size="small" round>Área activa</n-tag>
                  </template>
                  <n-form label-placement="top">
                    <n-grid responsive="screen" cols="1 s:2" :x-gap="12" :y-gap="8">
                      <n-form-item-gi :span="2" label="Seleccionar Área">
                        <n-input-group>
                          <n-select
                            v-model:value="currentArea"
                            :consistent-menu-width="true"
                            :options="areaOptions"
                            placeholder="Selecciona un área para editar"
                            @update:value="(_, opt) => { area.sale_printer = opt?.sale_printer || ''; area.account_printer = opt?.account_printer || ''; }"
                            clearable
                          />
                          <n-button
                            v-if="userStore.hasPermission('change_area')"
                            type="warning"
                            secondary
                            :disabled="!currentArea || !!area.id"
                            @click="editArea"
                            title="Editar nombre/impresoras de esta área"
                          >
                            <v-icon name="ri-edit-fill" />
                          </n-button>
                        </n-input-group>
                      </n-form-item-gi>
                      
                      <n-form-item-gi
                        v-if="userStore.hasPermission('add_area') || !!area.id"
                        :span="2"
                        label="Nombre / Descripción del Área"
                      >
                        <n-input
                          v-model:value="area.description"
                          placeholder="Ej: Terraza, Salón Principal, Barra..."
                        />
                      </n-form-item-gi>

                      <n-form-item-gi
                        v-if="userStore.hasPermission('add_area') || !!area.id"
                        :span="1"
                        label="Impresora de documentos"
                      >
                        <n-input v-model:value="area.sale_printer" placeholder="Nombre en Kuzeta" />
                      </n-form-item-gi>

                      <n-form-item-gi
                        v-if="userStore.hasPermission('add_area') || !!area.id"
                        :span="1"
                        label="Impresora de pre-cuentas"
                      >
                        <n-input v-model:value="area.account_printer" placeholder="Nombre en Kuzeta" />
                      </n-form-item-gi>

                      <n-form-item-gi v-if="userStore.hasPermission('add_area') || !!area.id" :span="2">
                        <n-space justify="end" class="w-100">
                          <n-button
                            type="error"
                            :disabled="!currentArea"
                            ghost
                            @click="performDeleteArea"
                          >
                            Eliminar
                          </n-button>
                          <n-button
                            type="error"
                            :disabled="!area.description"
                            secondary
                            @click="cleanArea"
                          >
                            Cancelar
                          </n-button>
                          <n-button
                            :type="!area.id ? 'info' : 'warning'"
                            :disabled="!area.description"
                            secondary
                            strong
                            @click="!area.id ? performCreateArea($event) : performUpdateArea($event)"
                          >
                            {{ !area.id ? "Agregar Área" : "Guardar Cambios" }}
                          </n-button>
                        </n-space>
                      </n-form-item-gi>
                    </n-grid>
                  </n-form>
                </n-card>
              </n-gi>

              <!-- Card 2: Apariencia Visual de Mesas en Salón -->
              <n-gi>
                <n-card title="Apariencia y Colores de Mesas" size="small" class="settings-subcard" :bordered="true">
                  <template #header-extra>
                    <n-tag type="success" size="small" round>En vivo (1:1 Salón)</n-tag>
                  </template>
                  <n-text depth="3" class="mb-3 d-block" style="font-size: 13px;">
                    Personaliza la posición, el tamaño de la etiqueta, los colores de estado y el degradado de las mesas en el salón.
                  </n-text>

                  <n-form label-placement="top">
                    <n-grid responsive="screen" cols="1 s:2" :x-gap="16" :y-gap="12">
                      <n-form-item-gi :span="2" label="Ubicación de la etiqueta de la mesa">
                        <n-select
                          v-model:value="tableVisualSettings.position"
                          :options="tablePositionOptions"
                          placeholder="Selecciona la posición de la etiqueta"
                        />
                      </n-form-item-gi>

                      <n-form-item-gi :span="2" label="Tamaño de la etiqueta de la mesa">
                        <div class="table-size-control-row">
                          <div class="slider-wrapper">
                            <n-slider
                              v-model:value="tableVisualSettings.size"
                              :min="11"
                              :max="48"
                              :step="1"
                              style="width: 100%;"
                            />
                          </div>
                          <n-input-number
                            v-model:value="tableVisualSettings.size"
                            :min="11"
                            :max="48"
                            :step="1"
                            size="medium"
                            style="width: 115px;"
                          >
                            <template #suffix>px</template>
                          </n-input-number>
                        </div>
                      </n-form-item-gi>

                      <!-- Colores por Estado -->
                      <n-form-item-gi :span="2" label="Colores de las mesas según su estado">
                        <n-grid responsive="screen" cols="1 s:3" :x-gap="12" :y-gap="10" class="w-100">
                          <n-gi>
                            <div class="color-picker-box">
                              <div class="color-picker-header">
                                <span class="color-dot" :style="{ backgroundColor: tableVisualSettings.color_free }"></span>
                                <span class="color-title">Libre</span>
                              </div>
                              <n-color-picker
                                v-model:value="tableVisualSettings.color_free"
                                :show-alpha="false"
                                :actions="['confirm']"
                                size="small"
                              />
                            </div>
                          </n-gi>
                          <n-gi>
                            <div class="color-picker-box">
                              <div class="color-picker-header">
                                <span class="color-dot" :style="{ backgroundColor: tableVisualSettings.color_occupied }"></span>
                                <span class="color-title">Ocupada</span>
                              </div>
                              <n-color-picker
                                v-model:value="tableVisualSettings.color_occupied"
                                :show-alpha="false"
                                :actions="['confirm']"
                                size="small"
                              />
                            </div>
                          </n-gi>
                          <n-gi>
                            <div class="color-picker-box">
                              <div class="color-picker-header">
                                <span class="color-dot" :style="{ backgroundColor: tableVisualSettings.color_locked }"></span>
                                <span class="color-title">Bloqueada</span>
                              </div>
                              <n-color-picker
                                v-model:value="tableVisualSettings.color_locked"
                                :show-alpha="false"
                                :actions="['confirm']"
                                size="small"
                              />
                            </div>
                          </n-gi>
                        </n-grid>
                      </n-form-item-gi>

                      <!-- Intensidad del Gradiente de Fondo -->
                      <n-form-item-gi :span="2" label="Intensidad de fondo / Degradado">
                        <div class="w-100">
                          <div class="table-size-control-row">
                            <div class="slider-wrapper">
                              <n-slider
                                v-model:value="tableVisualSettings.intensity"
                                :min="5"
                                :max="60"
                                :step="1"
                                style="width: 100%;"
                              />
                            </div>
                            <n-input-number
                              v-model:value="tableVisualSettings.intensity"
                              :min="5"
                              :max="60"
                              :step="1"
                              size="medium"
                              style="width: 115px;"
                            >
                              <template #suffix>%</template>
                            </n-input-number>
                          </div>
                          <div class="d-flex justify-content-between mt-1 text-muted" style="font-size: 11px;">
                            <span>5% (Más claro / suave)</span>
                            <span>15% (Predeterminado)</span>
                            <span>60% (Más oscuro / vivo)</span>
                          </div>
                        </div>
                      </n-form-item-gi>

                      <!-- Previsualización interactiva a TAMAÑO REAL 1:1 -->
                      <n-form-item-gi :span="2">
                        <template #label>
                          <div class="d-flex align-items-center justify-content-between w-100">
                            <span>Previsualización en vivo (Tamaño real del salón)</span>
                            <div class="preview-state-switcher">
                              <n-radio-group v-model:value="previewState" size="small">
                                <n-radio-button value="free">Libre</n-radio-button>
                                <n-radio-button value="occupied">Ocupada</n-radio-button>
                                <n-radio-button value="locked">Bloqueada</n-radio-button>
                              </n-radio-group>
                            </div>
                          </div>
                        </template>

                        <div class="table-preview-wrapper">
                          <!-- Tarjeta idéntica 1:1 a TableHome.vue -->
                          <div
                            class="table-real-card"
                            :style="{
                              borderTop: `5px solid ${previewCurrentColor}`,
                              background: previewBackgroundStyle
                            }"
                          >
                            <div class="d-flex flex-column justify-content-between h-100">
                              <!-- Top Row: Nombre / Número de mesa + Estado + Opciones -->
                              <div class="d-flex align-items-center justify-content-between w-100">
                                <div class="d-flex align-items-center gap-1 overflow-hidden me-1">
                                  <span
                                    v-if="tableVisualSettings.position === 'top_left'"
                                    class="preview-table-name"
                                    :style="{ fontSize: `${tableVisualSettings.size}px` }"
                                  >
                                    M-01
                                  </span>
                                </div>
                                <div
                                  v-if="tableVisualSettings.position === 'top_center'"
                                  class="text-center flex-grow-1 overflow-hidden mx-1"
                                >
                                  <span
                                    class="preview-table-name text-center"
                                    :style="{ fontSize: `${tableVisualSettings.size}px` }"
                                  >
                                    M-01
                                  </span>
                                </div>
                                <div
                                  class="d-flex align-items-center gap-1 flex-shrink-0"
                                  :class="{ 'ms-auto': tableVisualSettings.position === 'center' || tableVisualSettings.position === 'bottom_center' || !tableVisualSettings.position }"
                                >
                                  <span class="preview-status-badge" :style="previewBadgeStyle">
                                    {{ previewStatusText }}
                                  </span>
                                  <button type="button" class="preview-opt-btn" disabled>
                                    <v-icon name="bi-three-dots-vertical" scale="0.85" />
                                  </button>
                                </div>
                              </div>

                              <!-- Center: Ícono de mesa a tamaño real (102px) -->
                              <div class="preview-table-center position-relative flex-grow-1 my-1">
                                <img
                                  draggable="false"
                                  src="~@/assets/images/default-table.png"
                                  alt="Mesa"
                                  class="preview-real-table-img"
                                />
                                <!-- Posición Centro de la Mesa (Predeterminado) -->
                                <span
                                  v-if="tableVisualSettings.position === 'center' || !tableVisualSettings.position"
                                  class="preview-table-name preview-table-name-center"
                                  :style="{ fontSize: `${tableVisualSettings.size}px` }"
                                >
                                  M-01
                                </span>
                              </div>

                              <!-- Posición Abajo al Centro -->
                              <div
                                v-if="tableVisualSettings.position === 'bottom_center'"
                                class="text-center my-1 overflow-hidden"
                              >
                                <span
                                  class="preview-table-name text-center"
                                  :style="{ fontSize: `${tableVisualSettings.size}px` }"
                                >
                                  M-01
                                </span>
                              </div>

                              <!-- Bottom Row: Monto y/o Hora -->
                              <div class="preview-card-footer mt-auto">
                                <div v-if="previewState === 'occupied'" class="preview-order-pill">
                                  <span class="preview-order-amount">S/. 116.00</span>
                                  <span class="preview-order-time">
                                    <v-icon name="md-access-time-round" scale="0.75" class="me-1" />
                                    14:30
                                  </span>
                                </div>
                                <div v-else-if="previewState === 'locked'" class="text-center preview-free-hint">
                                  <span class="text-muted" style="font-size: 11px;">En atención</span>
                                </div>
                                <div v-else class="text-center preview-free-hint">
                                  <span class="text-muted" style="font-size: 11px;">Disponible</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <n-text depth="3" class="preview-caption mt-2">
                            Tamaño real 1:1 idéntico al mapa de mesas del salón ({{ tableVisualSettings.size }}px)
                          </n-text>
                        </div>
                      </n-form-item-gi>

                      <n-form-item-gi :span="2">
                        <n-space justify="end" class="w-100">
                          <n-button
                            type="info"
                            secondary
                            strong
                            :loading="isSavingVisualSettings"
                            @click="performSaveTableVisualSettings"
                          >
                            <template #icon><v-icon name="md-save-round" /></template>
                            Guardar Apariencia y Colores
                          </n-button>
                        </n-space>
                      </n-form-item-gi>
                    </n-grid>
                  </n-form>
                </n-card>
              </n-gi>

              <!-- Card 3: Gestión de Mesas del Área (ocupa todo el ancho inferior) -->
              <n-gi :span="2">
                <n-card
                  :title="currentArea ? 'Mesas del Área Seleccionada' : 'Mesas del Salón'"
                  size="small"
                  class="settings-subcard"
                  :bordered="true"
                >
                  <template #header-extra>
                    <n-text depth="3" v-if="currentArea">
                      Total: {{ tables.length }} mesas registradas
                    </n-text>
                  </template>

                  <!-- Formulario de mesa -->
                  <n-form
                    v-if="userStore.hasPermission('add_table') || selectedTable.id"
                    label-placement="top"
                    class="mb-3"
                  >
                    <n-grid responsive="screen" cols="1 s:3" :x-gap="12" :y-gap="8">
                      <n-form-item-gi label="Código de Mesa">
                        <n-input
                          v-model:value="selectedTable.code"
                          placeholder="Ej: M-01, 101, T-1..."
                        />
                      </n-form-item-gi>
                      <n-form-item-gi label="Descripción (Nombre Visible)">
                        <n-input
                          v-model:value="selectedTable.description"
                          placeholder="Ej: Mesa 1, Terraza 1..."
                        />
                      </n-form-item-gi>
                      <n-form-item-gi label="Acciones">
                        <n-space class="pt-1">
                          <n-button
                            type="error"
                            :disabled="!(selectedTable.code && selectedTable.description)"
                            ghost
                            @click="performDeleteTable"
                          >
                            Eliminar
                          </n-button>
                          <n-button
                            type="error"
                            :disabled="!(selectedTable.code && selectedTable.description)"
                            secondary
                            @click="cleanTable"
                          >
                            Cancelar
                          </n-button>
                          <n-button
                            :type="selectedTable.id ? 'warning' : 'info'"
                            :disabled="!(selectedTable.code && selectedTable.description) || !currentArea"
                            secondary
                            strong
                            @click.prevent="selectedTable.id ? performUpdateTable() : performCreateTable()"
                          >
                            {{ selectedTable.id ? "Guardar Mesa" : "Agregar Mesa" }}
                          </n-button>
                        </n-space>
                      </n-form-item-gi>
                    </n-grid>
                  </n-form>

                  <!-- Visualización de Mesas en Cuadrícula -->
                  <n-spin :show="isLoadingData">
                    <div v-if="!currentArea" class="empty-state-notice">
                      <v-icon name="gi-table" scale="2" class="mb-2 text-muted" />
                      <n-text depth="3">Selecciona un área arriba para visualizar o administrar sus mesas.</n-text>
                    </div>

                    <div v-else-if="tables.length === 0" class="empty-state-notice">
                      <v-icon name="gi-table" scale="2" class="mb-2 text-muted" />
                      <n-text depth="3">Esta área aún no tiene mesas creadas. Agrega una con el formulario superior.</n-text>
                    </div>

                    <n-grid
                      v-else
                      responsive="screen"
                      cols="2 s:4 m:6 l:8 xl:10 2xl:12"
                      :x-gap="12"
                      :y-gap="12"
                      class="mt-2"
                    >
                      <n-gi v-for="table in tables" :key="table.id">
                        <div
                          class="table-grid-card"
                          :class="{ 'is-selected': table.id === selectedTable.id }"
                          @click="userStore.hasPermission('change_table') && selectTable(table)"
                        >
                          <v-icon name="gi-table" scale="2.2" class="table-card-icon" />
                          <span
                            class="table-card-code"
                            :style="{ fontSize: `${tableVisualSettings.size}px` }"
                          >
                            {{ table.code }}
                          </span>
                        </div>
                      </n-gi>
                    </n-grid>
                  </n-spin>
                </n-card>
              </n-gi>

            </n-grid>
          </div>
        </n-tab-pane>

        <!-- 2. PESTAÑA: LUGARES DE PREPARACIÓN -->
        <n-tab-pane
          :disabled="!userStore.hasPermission('view_preparationplace')"
          name="PreparationPlaces"
          tab="Lugares de Preparación"
        >
          <div class="tab-pane-content" v-if="userStore.hasPermission('view_preparationplace')">
            <n-grid responsive="screen" cols="1 m:3" :x-gap="16" :y-gap="16">
              <n-gi :span="1">
                <n-card title="Lista de Lugares" size="small" class="settings-subcard" :bordered="true">
                  <n-list hoverable clickable class="settings-list">
                    <n-list-item
                      v-for="place in preparationPlaces"
                      :class="{ 'item-selected': selectedPlace === place.id }"
                      :key="place.id"
                      @click="userStore.hasPermission('change_preparationplace') && selectPlace(place)"
                    >
                      <div class="d-flex justify-content-between align-items-center w-100">
                        <n-text strong>{{ place.description }}</n-text>
                        <n-button
                          v-if="selectedPlace === place.id && userStore.hasPermission('change_preparationplace')"
                          type="error"
                          text
                          @click.stop="performDeletePreparationPlace"
                          title="Eliminar lugar"
                        >
                          <v-icon name="md-disabledbydefault-round" />
                        </n-button>
                      </div>
                    </n-list-item>
                  </n-list>
                </n-card>
              </n-gi>

              <n-gi :span="2">
                <n-card title="Datos del Lugar de Preparación" size="small" class="settings-subcard" :bordered="true">
                  <n-form v-if="userStore.hasPermission('add_preparationplace') || selectedPlace" label-placement="top">
                    <n-grid responsive="screen" cols="1 s:2" :x-gap="12" :y-gap="8">
                      <n-form-item-gi :span="2" label="Descripción / Zona">
                        <n-input v-model:value="preparationPlace" placeholder="Ej: Cocina Caliente, Barra de Bebidas..." />
                      </n-form-item-gi>
                      <n-form-item-gi label="Nombre de impresora (Kuzeta)">
                        <n-input v-model:value="printerName" placeholder="Ej: Cocina, Bar..." />
                      </n-form-item-gi>
                      <n-form-item-gi label="Formato de papel">
                        <n-select v-model:value="printerFormat" :options="printerFormatOptions" placeholder="Selecciona formato" />
                      </n-form-item-gi>
                      <n-form-item-gi :span="2">
                        <n-space justify="end" class="w-100">
                          <n-button
                            type="error"
                            secondary
                            :disabled="!preparationPlace"
                            @click="selectedPlace = null; preparationPlace = null; printerName = null; printerFormat = null;"
                          >
                            Cancelar
                          </n-button>
                          <n-button
                            :type="!selectedPlace ? 'info' : 'warning'"
                            :disabled="!preparationPlace"
                            secondary
                            strong
                            @click="!selectedPlace ? performCreatePreparationPlace() : performUpdatePreparationPlace()"
                          >
                            {{ !selectedPlace ? "Agregar Lugar" : "Guardar Cambios" }}
                          </n-button>
                        </n-space>
                      </n-form-item-gi>
                    </n-grid>
                  </n-form>
                </n-card>
              </n-gi>
            </n-grid>
          </div>
        </n-tab-pane>

        <!-- 3. PESTAÑA: CATEGORÍAS DE PRODUCTO -->
        <n-tab-pane
          :disabled="!userStore.hasPermission('view_productcategory')"
          name="ProductCategories"
          tab="Categorías de Producto"
        >
          <div class="tab-pane-content" v-if="userStore.hasPermission('view_productcategory')">
            <n-grid responsive="screen" cols="1 m:3" :x-gap="16" :y-gap="16">
              <n-gi :span="1">
                <n-card title="Lista de Categorías" size="small" class="settings-subcard" :bordered="true">
                  <n-list hoverable clickable class="settings-list">
                    <n-list-item
                      v-for="category in productCategories"
                      :class="{ 'item-selected': selectedCategory === category.id }"
                      :key="category.id"
                      @click="userStore.hasPermission('change_productcategory') && selectCategory(category)"
                    >
                      <div class="d-flex justify-content-between align-items-center w-100">
                        <n-text strong>{{ category.description }}</n-text>
                        <n-tag v-if="category.is_disabled" type="warning" size="small" round>Inactivo</n-tag>
                      </div>
                    </n-list-item>
                  </n-list>
                </n-card>
              </n-gi>

              <n-gi :span="2">
                <n-card title="Datos de la Categoría" size="small" class="settings-subcard" :bordered="true">
                  <n-form v-if="userStore.hasPermission('add_productcategory') || selectedCategory" label-placement="top">
                    <n-grid responsive="screen" cols="1 s:2" :x-gap="12" :y-gap="8">
                      <n-form-item-gi :span="2" label="Descripción de Categoría">
                        <n-input v-model:value="productCategory" placeholder="Ej: Bebidas, Platos de Fondo, Postres..." />
                      </n-form-item-gi>
                      <n-form-item-gi label="Estado Inactivo">
                        <n-switch v-model:value="is_disabled" />
                      </n-form-item-gi>
                      <n-form-item-gi>
                        <n-space justify="end" class="w-100">
                          <n-button
                            type="error"
                            secondary
                            :disabled="!productCategory"
                            @click="selectedCategory = null; productCategory = null;"
                          >
                            Cancelar
                          </n-button>
                          <n-button
                            :type="!selectedCategory ? 'info' : 'warning'"
                            :disabled="!productCategory"
                            secondary
                            strong
                            @click="!selectedCategory ? performCreateProductCategory() : performUpdateProductCategory()"
                          >
                            {{ !selectedCategory ? "Agregar Categoría" : "Guardar Cambios" }}
                          </n-button>
                        </n-space>
                      </n-form-item-gi>
                    </n-grid>
                  </n-form>
                </n-card>
              </n-gi>
            </n-grid>
          </div>
        </n-tab-pane>

        <!-- 4. PESTAÑA: MÉTODOS DE PAGO -->
        <n-tab-pane
          :disabled="!userStore.hasPermission('view_paymentmethodtype')"
          name="PaymentMethods"
          tab="Métodos de Pago"
        >
          <div class="tab-pane-content" v-if="userStore.hasPermission('view_paymentmethodtype')">
            <n-grid responsive="screen" cols="1 m:3" :x-gap="16" :y-gap="16">
              <n-gi :span="1">
                <n-card title="Métodos Registrados" size="small" class="settings-subcard" :bordered="true">
                  <n-list hoverable clickable class="settings-list">
                    <n-list-item
                      v-for="payment in paymentMethods"
                      :class="{ 'item-selected': selectedPayment === payment.id }"
                      :key="payment.id"
                      @click="userStore.hasPermission('change_paymentmethodtype') && selectPaymentMethod(payment)"
                    >
                      <div class="d-flex justify-content-between align-items-center w-100">
                        <n-text strong>{{ payment.description }}</n-text>
                        <n-button
                          v-if="userStore.hasPermission('change_paymentmethodtype') && selectedPayment === payment.id"
                          type="error"
                          text
                          @click.stop="performDeletePaymentMethod"
                          title="Eliminar método"
                        >
                          <v-icon name="md-disabledbydefault-round" />
                        </n-button>
                      </div>
                    </n-list-item>
                  </n-list>
                </n-card>
              </n-gi>

              <n-gi :span="2">
                <n-card title="Datos del Método de Pago" size="small" class="settings-subcard" :bordered="true">
                  <n-form v-if="userStore.hasPermission('add_paymentmethodtype') || selectedPayment" label-placement="top">
                    <n-grid responsive="screen" cols="1" :x-gap="12" :y-gap="8">
                      <n-form-item-gi label="Descripción del Método de Pago">
                        <n-input v-model:value="paymentMethod" placeholder="Ej: Efectivo, Yape, Plin, Tarjeta Visa..." />
                      </n-form-item-gi>
                      <n-form-item-gi>
                        <n-space justify="end" class="w-100">
                          <n-button
                            type="error"
                            secondary
                            :disabled="!paymentMethod"
                            @click="selectedPayment = null; paymentMethod = null;"
                          >
                            Cancelar
                          </n-button>
                          <n-button
                            :type="!selectedPayment ? 'info' : 'warning'"
                            :disabled="!paymentMethod"
                            secondary
                            strong
                            @click="!selectedPayment ? performCreatePaymentMethod() : performUpdatePaymentMethod()"
                          >
                            {{ !selectedPayment ? "Agregar Método" : "Guardar Cambios" }}
                          </n-button>
                        </n-space>
                      </n-form-item-gi>
                    </n-grid>
                  </n-form>
                </n-card>
              </n-gi>
            </n-grid>
          </div>
        </n-tab-pane>

        <!-- 5. PESTAÑA: CONCEPTOS DE CAJA -->
        <n-tab-pane
          :disabled="!userStore.hasPermission('view_concept')"
          name="Concepts"
          tab="Conceptos de Caja"
        >
          <div class="tab-pane-content" v-if="userStore.hasPermission('view_concept')">
            <n-grid responsive="screen" cols="1 m:3" :x-gap="16" :y-gap="16">
              <n-gi :span="1">
                <n-card title="Lista de Conceptos" size="small" class="settings-subcard" :bordered="true">
                  <n-list hoverable clickable class="settings-list">
                    <n-list-item
                      v-for="single_concept in concepts"
                      :class="{ 'item-selected': selectedConcept === single_concept.id }"
                      :key="single_concept.id"
                      @click="userStore.hasPermission('change_concept') && selectConcept(single_concept)"
                    >
                      <div class="d-flex justify-content-between align-items-center w-100">
                        <n-text strong>{{ single_concept.description }}</n-text>
                        <div class="d-flex align-items-center gap-2">
                          <n-tag
                            v-if="single_concept.id !== selectedConcept"
                            :type="single_concept.concept_type === '0' ? 'success' : 'error'"
                            size="small"
                            round
                          >
                            {{ single_concept.concept_type === "0" ? "Ingreso" : "Egreso" }}
                          </n-tag>
                          <n-button v-else type="error" text @click.stop="performDeleteConcept" title="Eliminar concepto">
                            <v-icon name="md-disabledbydefault-round" />
                          </n-button>
                        </div>
                      </div>
                    </n-list-item>
                  </n-list>
                </n-card>
              </n-gi>

              <n-gi :span="2">
                <n-card title="Datos del Concepto de Caja" size="small" class="settings-subcard" :bordered="true">
                  <n-form v-if="userStore.hasPermission('add_concept') || selectedConcept" label-placement="top">
                    <n-grid responsive="screen" cols="1 s:2" :x-gap="12" :y-gap="8">
                      <n-form-item-gi label="Tipo de Movimiento">
                        <n-select :options="conceptTypeOptions" v-model:value="concept.concept_type" placeholder="Selecciona tipo" />
                      </n-form-item-gi>
                      <n-form-item-gi label="Descripción del Concepto">
                        <n-input v-model:value="concept.description" placeholder="Ej: Pago de Proveedor, Adelanto..." />
                      </n-form-item-gi>
                      <n-form-item-gi :span="2">
                        <n-space justify="end" class="w-100">
                          <n-button
                            type="error"
                            secondary
                            :disabled="!concept.description || !concept.concept_type"
                            @click="selectedConcept = null; concept = { description: '', concept_type: null };"
                          >
                            Cancelar
                          </n-button>
                          <n-button
                            :type="!selectedConcept ? 'info' : 'warning'"
                            :disabled="!concept.description || !concept.concept_type"
                            secondary
                            strong
                            @click="!selectedConcept ? performCreateConcept() : performUpdateConcept()"
                          >
                            {{ !selectedConcept ? "Agregar Concepto" : "Guardar Cambios" }}
                          </n-button>
                        </n-space>
                      </n-form-item-gi>
                    </n-grid>
                  </n-form>
                </n-card>
              </n-gi>
            </n-grid>
          </div>
        </n-tab-pane>

        <!-- 6. PESTAÑA: KARDEX (CONCEPTOS DE INVENTARIO) -->
        <n-tab-pane
          :disabled="!userStore.hasPermission('view_inventoryconcept')"
          name="Kardex"
          tab="Conceptos de Inventario"
        >
          <div class="tab-pane-content" v-if="userStore.hasPermission('view_inventoryconcept')">
            <n-grid responsive="screen" cols="1 m:3" :x-gap="16" :y-gap="16">
              <n-gi :span="1">
                <n-card title="Conceptos de Inventario" size="small" class="settings-subcard" :bordered="true">
                  <n-list hoverable clickable class="settings-list">
                    <n-list-item
                      v-for="c in inventory_concepts"
                      :class="{ 'item-selected': selectedInventoryConcept === c.id }"
                      :key="c.id"
                      @click="userStore.hasPermission('change_inventoryconcept') && selectInventoryConcept(c)"
                    >
                      <div class="d-flex justify-content-between align-items-center w-100">
                        <n-text strong>{{ c.concept }}</n-text>
                        <div class="d-flex align-items-center gap-2">
                          <n-tag
                            v-if="c.id !== selectedInventoryConcept"
                            :type="c.concept_type === '0' ? 'success' : 'error'"
                            size="small"
                            round
                          >
                            {{ c.concept_type === "0" ? "Ingreso" : "Egreso" }}
                          </n-tag>
                          <n-button v-else type="error" text @click.stop="performDeleteInventoryConcept" title="Eliminar concepto">
                            <v-icon name="md-disabledbydefault-round" />
                          </n-button>
                        </div>
                      </div>
                    </n-list-item>
                  </n-list>
                </n-card>
              </n-gi>

              <n-gi :span="2">
                <n-card title="Datos del Concepto de Inventario" size="small" class="settings-subcard" :bordered="true">
                  <n-form v-if="userStore.hasPermission('add_inventoryconcept') || selectedInventoryConcept" label-placement="top">
                    <n-grid responsive="screen" cols="1 s:2" :x-gap="12" :y-gap="8">
                      <n-form-item-gi label="Tipo de Movimiento">
                        <n-select :options="conceptTypeOptions" v-model:value="inventory_concept.concept_type" placeholder="Selecciona tipo" />
                      </n-form-item-gi>
                      <n-form-item-gi label="Descripción del Concepto">
                        <n-input v-model:value="inventory_concept.description" placeholder="Ej: Merma, Compra inicial, Ajuste..." />
                      </n-form-item-gi>
                      <n-form-item-gi :span="2">
                        <n-space justify="end" class="w-100">
                          <n-button
                            type="error"
                            secondary
                            :disabled="!inventory_concept.description || !inventory_concept.concept_type"
                            @click="selectedInventoryConcept = null; inventory_concept = { description: '', concept_type: null };"
                          >
                            Cancelar
                          </n-button>
                          <n-button
                            :type="!selectedInventoryConcept ? 'info' : 'warning'"
                            :disabled="!inventory_concept.description || !inventory_concept.concept_type"
                            secondary
                            strong
                            @click="!selectedInventoryConcept ? performCreateInventoryConcept() : performUpdateInventoryConcept()"
                          >
                            {{ !selectedInventoryConcept ? "Agregar Concepto" : "Guardar Cambios" }}
                          </n-button>
                        </n-space>
                      </n-form-item-gi>
                    </n-grid>
                  </n-form>
                </n-card>
              </n-gi>
            </n-grid>
          </div>
        </n-tab-pane>

        <!-- 7. PESTAÑA: GUARNICIONES -->
        <n-tab-pane name="Guarniciones" tab="Guarniciones">
          <div class="tab-pane-content">
            <n-grid responsive="screen" cols="1 m:3" :x-gap="16" :y-gap="16">
              <n-gi :span="1">
                <n-card title="Lista de Guarniciones" size="small" class="settings-subcard" :bordered="true">
                  <n-list hoverable clickable class="settings-list">
                    <n-list-item
                      v-for="g in guarnitionOptions"
                      :class="{ 'item-selected': selectedGuarnition === g.id }"
                      :key="g.id"
                      @click="selectGuarnition(g)"
                    >
                      <div class="d-flex justify-content-between align-items-center w-100">
                        <n-text strong>{{ g.name }}</n-text>
                        <n-button
                          v-if="g.id === selectedGuarnition"
                          type="error"
                          text
                          @click.stop="performDeleteGuarnition"
                          title="Eliminar guarnición"
                        >
                          <v-icon name="md-disabledbydefault-round" />
                        </n-button>
                      </div>
                    </n-list-item>
                  </n-list>
                </n-card>
              </n-gi>

              <n-gi :span="2">
                <n-card title="Datos de la Guarnición" size="small" class="settings-subcard" :bordered="true">
                  <n-form v-if="userStore.hasPermission('add_inventoryconcept') || selectedGuarnition" label-placement="top">
                    <n-grid responsive="screen" cols="1 s:2" :x-gap="12" :y-gap="8">
                      <n-form-item-gi label="Lugar de preparación">
                        <n-select :options="placesOptions" v-model:value="guarnition.preparation_place_id" placeholder="Selecciona lugar" />
                      </n-form-item-gi>
                      <n-form-item-gi label="Nombre de Guarnición">
                        <n-input v-model:value="guarnition.name" placeholder="Ej: Papas fritas, Ensalada fresca..." />
                      </n-form-item-gi>
                      <n-form-item-gi :span="2">
                        <n-space justify="end" class="w-100">
                          <n-button
                            type="error"
                            secondary
                            :disabled="!guarnition.name || !guarnition.preparation_place_id"
                            @click="selectedGuarnition = null; guarnition = { name: '', preparation_place: null, preparation_place_id: null };"
                          >
                            Cancelar
                          </n-button>
                          <n-button
                            :type="!selectedGuarnition ? 'info' : 'warning'"
                            :disabled="!guarnition.name || !guarnition.preparation_place_id"
                            secondary
                            strong
                            @click="!selectedGuarnition ? performCreateGuarnition() : performUpdateGuarnition()"
                          >
                            {{ !selectedGuarnition ? "Agregar Guarnición" : "Guardar Cambios" }}
                          </n-button>
                        </n-space>
                      </n-form-item-gi>
                    </n-grid>
                  </n-form>
                </n-card>
              </n-gi>
            </n-grid>
          </div>
        </n-tab-pane>

      </n-tabs>
    </n-card>
  </div>
</template>

<script>
import { defineComponent, computed, ref, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useMessage, useDialog } from "naive-ui";
import { cloneDeep } from "@/utils";
import { useTableStore } from "@/store/modules/table";
import { useUserStore } from "@/store/modules/user";
import { usePrinterStore } from "@/store/modules/printer";
import { useProductStore } from "@/store/modules/product";
import { useSettingsStore } from "@/store/modules/settings";
import { updateBusinessSettings } from "@/api/modules/business";
import {
  createArea,
  updateArea,
  disableArea,
  createTable,
  updateTable,
  disableTable,
} from "@/api/modules/tables";
import {
  getPaymentMethods,
  deletePaymentMethod,
  createPaymentMethodDesc,
  updatePaymentMethodDesc,
} from "@/api/modules/sales";
import {
    getProductPlaces,
    createProductPlace,
    updateProductPlace,
    disableProductPlace,
    getProductCategories,
    createProductCategory,
    updateProductCategory,
    getInventoryConcepts,
    createInventoryConcept,
    updateInventoryConcept,
    deleteInventoryConcept,
    createGuarnition,
    updateGuarnition,
    deleteGuarnition,
    getProductFittings
} from "@/api/modules/products";
import { getConcepts, createConcept, updateConcept, deleteConcept } from "@/api/modules/tills";

export default defineComponent({
  name: "GeneralSettings",
  setup() {
    const message = useMessage();
    const dialog = useDialog();
    const router = useRouter();
    const tableStore = useTableStore();
    const settingsStore = useSettingsStore();
    const printerStore = usePrinterStore();
    const productStore = useProductStore();
    const optionsPrinters = ref([]);
    const userStore = useUserStore();
    const isLoadingData = ref(false);
    const activeTab = ref("areas-tables");

    // Configuración visual de mesas en salón (ubicación, tamaño, colores y gradiente)
    const isSavingVisualSettings = ref(false);
    const tableVisualSettings = ref({
      position: 'center',
      size: 15,
      color_free: '#4caf50',
      color_occupied: '#f44336',
      color_locked: '#ffc107',
      intensity: 15,
    });

    const previewState = ref('free'); // 'free' | 'occupied' | 'locked'

    const hexToRgba = (hex, alphaPercent = 15) => {
      if (!hex) return 'rgba(255, 255, 255, 1)';
      let c = hex.replace('#', '');
      if (c.length === 3) {
        c = c.split('').map(x => x + x).join('');
      }
      const r = parseInt(c.substring(0, 2), 16) || 0;
      const g = parseInt(c.substring(2, 4), 16) || 0;
      const b = parseInt(c.substring(4, 6), 16) || 0;
      const a = Math.max(0.02, Math.min(0.9, (alphaPercent || 15) / 100));
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    };

    const previewCurrentColor = computed(() => {
      if (previewState.value === 'occupied') return tableVisualSettings.value.color_occupied || '#f44336';
      if (previewState.value === 'locked') return tableVisualSettings.value.color_locked || '#ffc107';
      return tableVisualSettings.value.color_free || '#4caf50';
    });

    const previewBackgroundStyle = computed(() => {
      const rgba = hexToRgba(previewCurrentColor.value, tableVisualSettings.value.intensity);
      return `linear-gradient(180deg, ${rgba} 0%, #ffffff 100%)`;
    });

    const previewBadgeStyle = computed(() => {
      const bg = hexToRgba(previewCurrentColor.value, 18);
      return {
        backgroundColor: bg,
        color: previewCurrentColor.value,
      };
    });

    const previewStatusText = computed(() => {
      if (previewState.value === 'occupied') return 'Ocupada';
      if (previewState.value === 'locked') return 'Bloqueada';
      return 'Libre';
    });

    const tablePositionOptions = [
      { label: "Centro (Predeterminado)", value: "center" },
      { label: "Arriba a la izquierda", value: "top_left" },
      { label: "Arriba al centro", value: "top_center" },
      { label: "Abajo al centro", value: "bottom_center" },
    ];

    const syncVisualSettingsFromStore = () => {
      const orderCfg = settingsStore.businessSettings?.order || {};
      tableVisualSettings.value.position = orderCfg.table_label_position || 'center';
      const sizeVal = Number(orderCfg.table_label_size);
      tableVisualSettings.value.size = sizeVal && sizeVal >= 10 && sizeVal <= 48 ? sizeVal : 15;
      tableVisualSettings.value.color_free = orderCfg.table_color_free || '#4caf50';
      tableVisualSettings.value.color_occupied = orderCfg.table_color_occupied || '#f44336';
      tableVisualSettings.value.color_locked = orderCfg.table_color_locked || '#ffc107';
      const intensityVal = Number(orderCfg.table_gradient_intensity);
      tableVisualSettings.value.intensity = intensityVal && intensityVal >= 5 && intensityVal <= 80 ? intensityVal : 15;
    };

    watch(
      () => settingsStore.businessSettings,
      () => {
        syncVisualSettingsFromStore();
      },
      { deep: true, immediate: true }
    );

    const performSaveTableVisualSettings = async () => {
      try {
        isSavingVisualSettings.value = true;
        const currentBusinessSettings = cloneDeep(settingsStore.businessSettings || {});
        if (!currentBusinessSettings.order) {
          currentBusinessSettings.order = {};
        }
        currentBusinessSettings.order.table_label_position = tableVisualSettings.value.position;
        currentBusinessSettings.order.table_label_size = Number(tableVisualSettings.value.size) || 15;
        currentBusinessSettings.order.table_color_free = tableVisualSettings.value.color_free || '#4caf50';
        currentBusinessSettings.order.table_color_occupied = tableVisualSettings.value.color_occupied || '#f44336';
        currentBusinessSettings.order.table_color_locked = tableVisualSettings.value.color_locked || '#ffc107';
        currentBusinessSettings.order.table_gradient_intensity = Number(tableVisualSettings.value.intensity) || 15;

        const response = await updateBusinessSettings(currentBusinessSettings);
        if (response.status === 202) {
          settingsStore.business_settings = response.data;
          message.success("Configuración de mesas guardada con éxito");
        }
      } catch (error) {
        console.error("Error al guardar configuración visual de mesas:", error);
        message.error("Error al guardar la configuración de mesas");
      } finally {
        isSavingVisualSettings.value = false;
      }
    };

    const currentArea = ref(null);
    const area = ref({
      id: null,
      description: "",
      sale_printer: '',
      account_printer: '',
    });
    const selectedTable = ref({
      id: null,
      code: "",
      description: "",
    });
    const areaOptions = computed(() => {
      return tableStore.getAreasOptions;
    });
    const tables = computed(() => {
      let a = tableStore.areas.find((a) => a.id === currentArea.value);
      if (a) {
        return a.tables;
      }
      return [];
    });

      // const getPrinters = async () => {
      //     try {
      //         const response = await fetch(`${settingsStore.business_settings.qz_config.host}/printers`, {
      //             method: 'GET'
      //         });
      //
      //         if (!response.ok) {
      //             throw new Error(`Error en la solicitud: ${response.status}`);
      //         }
      //
      //         const data = await response.json();  // Si la respuesta es JSON
      //         console.log(data);
      //         optionsPrinters.value = data.printers.map(printer =>({
      //             value: printer,
      //             label: printer,
      //         }))
      //     } catch (error) {
      //         console.error('Error al hacer la solicitud:', error);
      //     }
      // };

      // getPrinters()

    const productCategories = ref([]);
    const guarnitionOptions = ref([]);
    const productCategory = ref(null);
    const is_disabled = ref(false);
    const selectedCategory = ref(null);

    const selectTable = (table) => {
      if (!selectedTable.value.id) {
        selectedTable.value = cloneDeep(table);
      } else {
        if (selectedTable.value.id === table.id) {
          cleanTable();
        } else {
          selectedTable.value = cloneDeep(table);
        }
      }
    };

    const cleanTable = () => {
      selectedTable.value = {
        id: null,
        code: "",
        description: "",
      };
    };

      const placesOptions = computed(() => {
          return productStore.places.map((place) => ({
              label: place.description,
              value: place.id,
          }));
      });

    const performCreateTable = async () => {
      isLoadingData.value = true;
      await createTable(currentArea.value, selectedTable.value)
        .then((response) => {
          if (response.status === 201) {
            tableStore.refreshData().then(() => {
              cleanTable();
            });
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          isLoadingData.value = false;
        });
    };

    const performUpdateTable = async () => {
      isLoadingData.value = true;
      await updateTable(currentArea.value, selectedTable.value)
        .then((response) => {
          if (response.status === 202) {
            tableStore.refreshData().then(() => {
              cleanTable();
            });
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          currentArea.value = null;
          isLoadingData.value = false;
        });
    };

    const performDeleteTable = () => {
      if (!selectedTable.value.id) return;
      dialog.error({
        title: "Eliminando mesa",
        content: "¿Está seguro?",
        positiveText: "Sí",
        onPositiveClick: async () => {
          try {
            isLoadingData.value = true;
            const response = await disableTable(selectedTable.value.id);
            if (response.status === 202) {
              tableStore.refreshData().then(() => {
                cleanTable();
              });
            }
          } catch (error) {
            console.error(error);
            message.error("Algo salió mal...");
          } finally {
            isLoadingData.value = false;
          }
        }
      });
    };

    const performCreateArea = async (e) => {
      e.preventDefault();
      isLoadingData.value = true;
      await createArea(area.value)
        .then((response) => {
          if (response.status === 201) {
            tableStore
              .refreshData()
              .then(() => {
                cleanArea();
              })
              .catch((error) => {
                console.error(error);
                message.error("Algo salió mal...");
              });
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          isLoadingData.value = false;
        });
    };

    const performUpdateArea = async (e) => {
      e.preventDefault();
      isLoadingData.value = true;
      await updateArea(area.value.id, area.value)
        .then((response) => {
          if (response.status === 202) {
            tableStore
              .refreshData()
              .then(() => {
                cleanArea();
              })
              .catch((error) => {
                console.error(error);
                message.error("Algo salió mal...");
              });
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          isLoadingData.value = false;
        });
    };

    const performDeleteArea = () => {
      if (!currentArea.value) return;
      dialog.error({
        title: "Eliminando área",
        content: "¿Está seguro?",
        positiveText: "Sí",
        onPositiveClick: async () => {
          try {
            isLoadingData.value = true;
            const response = await disableArea(currentArea.value);
            if (response.status === 202) {
              tableStore
                .refreshData()
                .then(() => {
                  cleanArea();
                })
                .catch((error) => {
                  console.error(error);
                  message.error("Algo salió mal...");
                });
            }
          } catch (error) {
            console.error(error);
            message.error("Algo salió mal...");
          } finally {
            isLoadingData.value = false;
          }
        }
      });
    };

    const editArea = () => {
      area.value.id = cloneDeep(currentArea.value);
      area.value.description = cloneDeep(
        tableStore.getAreaByID(currentArea.value)
      );
    };

    const cleanArea = () => {
      area.value = {
        id: null,
        description: "",
      };
    };

    const selectedPlace = ref(null);
    const preparationPlaces = ref([]);
    const preparationPlace = ref(null);
    const printerName = ref(null);
    const printerFormat = ref(null);
    const printerFormatOptions = [
      {
        value: 58,
        label: "58 mm",
      },
      {
        value: 80,
        label: "80 mm",
      },
    ];

    const selectPlace = (place) => {
      if (!selectedPlace.value) {
        selectedPlace.value = place.id;
        preparationPlace.value = cloneDeep(place.description);
        printerName.value = cloneDeep(place.printer_name);
        printerFormat.value = cloneDeep(place.printer_format);
      } else {
        if (selectedPlace.value === place.id) {
          selectedPlace.value = null;
          preparationPlace.value = null;
          printerName.value = null;
          printerFormat.value = null;
        } else {
          selectedPlace.value = place.id;
          preparationPlace.value = cloneDeep(place.description);
          printerName.value = cloneDeep(place.printer_name);
          printerFormat.value = cloneDeep(place.printer_format);
        }
      }
    };

    const loadPreparationPlaces = async () => {
      await getProductPlaces()
        .then((response) => {
          if (response.status === 200) {
            preparationPlaces.value = response.data.filter(place => !place.is_disabled);
            productStore.initializeStore();
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        });
    };

    const performCreatePreparationPlace = async () => {
      await createProductPlace(
        preparationPlace.value,
        printerName.value,
        printerFormat.value
      )
        .then((response) => {
          if (response.status === 201) {
            loadPreparationPlaces();
            productStore.initializeStore();
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          preparationPlace.value = null;
          printerName.value = null;
          printerFormat.value = null;
        });
    };

    const performUpdatePreparationPlace = async () => {
      await updateProductPlace(
        selectedPlace.value,
        preparationPlace.value,
        printerName.value,
        printerFormat.value
      )
        .then((response) => {
          if (response.status === 202) {
            loadPreparationPlaces();
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          selectedPlace.value = null;
          preparationPlace.value = null;
          printerName.value = null;
          printerFormat.value = null;
        });
    };

    const performDeletePreparationPlace = async () => {
      if (!selectedPlace.value) return;
      dialog.error({
        title: "Eliminando lugar de preparación",
        content: "¿Está seguro?",
        positiveText: "Sí",
        onPositiveClick: async () => {
          try {
            const response = await disableProductPlace(selectedPlace.value);
            if (response.status === 202) {
              loadPreparationPlaces();
            }
          } catch (error) {
            console.error(error);
            message.error("Algo salió mal...");
          } finally {
            selectedPlace.value = null;
            preparationPlace.value = null;
            printerName.value = null;
            printerFormat.value = null;
          }
        }
      });
    };

    const selectCategory = (category) => {
      if (!selectedCategory.value) {
        selectedCategory.value = category.id;
        productCategory.value = cloneDeep(category.description);
        is_disabled.value = cloneDeep(category.is_disabled)
      } else {
        if (selectedCategory.value === category.id) {
          selectedCategory.value = null;
          productCategory.value = null;
        } else {
          selectedCategory.value = category.id;
          productCategory.value = cloneDeep(category.description);
          is_disabled.value = cloneDeep(category.is_disabled)
        }
      }
    };

    const loadProductCategories = async () => {
      await getProductCategories()
        .then((response) => {
          if (response.status === 200) {
            productCategories.value = response.data;
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        });
    };

    const performCreateProductCategory = async () => {
      await createProductCategory(productCategory.value, is_disabled.value)
        .then((response) => {
          if (response.status === 201) {
            loadProductCategories();
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          productCategory.value = null;
        });
    };

    const performUpdateProductCategory = async () => {
      await updateProductCategory(selectedCategory.value, productCategory.value, is_disabled.value)
        .then((response) => {
          if (response.status === 202) {
            loadProductCategories();
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          selectedCategory.value = null;
          productCategory.value = null;
        });
    };

    const paymentMethods = ref([]);
    const paymentMethod = ref(null);
    const selectedPayment = ref(null);

    const selectPaymentMethod = (payment) => {
      if (!selectedPayment.value) {
        selectedPayment.value = payment.id;
        paymentMethod.value = cloneDeep(payment.description);
      } else {
        if (selectedPayment.value === payment.id) {
          selectedPayment.value = null;
          paymentMethod.value = null;
        } else {
          selectedPayment.value = payment.id;
          paymentMethod.value = cloneDeep(payment.description);
        }
      }
    };

    const loadPaymentMethods = async () => {
      await getPaymentMethods()
        .then((response) => {
          if (response.status === 200) {
            paymentMethods.value = response.data;
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        });
    };

    const performCreatePaymentMethod = async () => {
      await createPaymentMethodDesc(paymentMethod.value)
        .then((response) => {
          if (response.status === 201) {
            loadPaymentMethods();
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          paymentMethod.value = null;
        });
    };

    const performUpdatePaymentMethod = async () => {
      await updatePaymentMethodDesc(selectedPayment.value, paymentMethod.value)
        .then((response) => {
          if (response.status === 202) {
            loadPaymentMethods();
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          selectedPayment.value = null;
          paymentMethod.value = null;
        });
    };

    const performDeletePaymentMethod = () => {
      if (!selectedPayment.value) return;
      dialog.error({
        title: "Eliminando método de pago",
        content: "¿Está seguro?",
        positiveText: "Sí",
        onPositiveClick: async () => {
          await deletePaymentMethod(selectedPayment.value)
            .then((response) => {
              if (response.status === 202) {
                loadPaymentMethods();
              }
            })
            .catch((error) => {
              console.error(error);
              message.error("Algo salió mal...");
            })
            .finally(() => {
              paymentMethod.value = null;
              selectedPayment.value = null;
            });
        }
      })
    };

    const concepts = ref([]);
    const concept = ref({
      description: "",
      concept_type: null,
    });
    const selectedConcept = ref(null);

    const conceptTypeOptions = [
      {
        label: "Ingreso",
        value: "0",
      },
      {
        label: "Egreso",
        value: "1",
      },
    ];

    const selectConcept = (single_concept) => {
      if (!selectedConcept.value) {
        selectedConcept.value = single_concept.id;
        concept.value.description = cloneDeep(single_concept.description);
        concept.value.concept_type = cloneDeep(single_concept.concept_type);
      } else {
        if (selectedConcept.value === single_concept.id) {
          selectedConcept.value = null;
          concept.value.description = null;
          concept.value.concept_type = null;
        } else {
          selectedConcept.value = single_concept.id;
          concept.value.description = cloneDeep(single_concept.description);
          concept.value.concept_type = cloneDeep(single_concept.concept_type);
        }
      }
    };

    const loadConcepts = async () => {
      await getConcepts()
        .then((response) => {
          if (response.status === 200) {
            concepts.value = response.data;
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        });
    };

    const performCreateConcept = async () => {
      await createConcept(concept.value)
        .then((response) => {
          if (response.status === 201) {
            loadConcepts();
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          concept.value = { description: "", concept_type: null };
        });
    };

    const performUpdateConcept = async () => {
      await updateConcept(selectedConcept.value, concept.value)
        .then((response) => {
          if (response.status === 202) {
            loadConcepts();
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          selectedConcept.value = null;
          concept.value = { description: "", concept_type: null };
        });
    };

    const performDeleteConcept = () => {
      if (!selectedConcept.value) return;
      dialog.error({
          title: "Eliminando concepto",
          content: "¿Está seguro?",
          positiveText: "Sí",
          onPositiveClick: async () => {
            await deleteConcept(selectedConcept.value)
              .then((response) => {
                if (response.status === 202) {
                    loadConcepts();
                }
              })
              .catch((error) => {
                console.error(error);
                message.error("Algo salió mal...");
              })
              .finally(() => {
                concept.value = { description: "", concept_type: null };
                selectedConcept.value = null;
              });
          }
      })
    };

    const inventory_concepts = ref([]);
    const inventory_concept = ref({
      description: "",
      concept_type: null,
    });

    const guarnition = ref({
      name: "",
      preparation_place: null,
      preparation_place_id: null
    });

    const selectedInventoryConcept = ref(null);
    const selectedGuarnition = ref(null);

    const selectInventoryConcept = (single_concept) => {
      if (!selectedInventoryConcept.value) {
        selectedInventoryConcept.value = single_concept.id;
        inventory_concept.value.description = cloneDeep(single_concept.concept);
        inventory_concept.value.concept_type = cloneDeep(
          single_concept.concept_type
        );
      } else {
        if (selectedInventoryConcept.value === single_concept.id) {
          selectedInventoryConcept.value = null;
          inventory_concept.value.description = null;
          inventory_concept.value.concept_type = null;
        } else {
          selectedInventoryConcept.value = single_concept.id;
          inventory_concept.value.description = cloneDeep(
            single_concept.concept
          );
          inventory_concept.value.concept_type = cloneDeep(
            single_concept.concept_type
          );
        }
      }
    };

      const selectGuarnition = (guarnition) => {
          if(!selectedGuarnition.value) {
              selectedGuarnition.value = guarnition.id;
              guarnition.value.name = cloneDeep(guarnition.name);
              guarnition.value.preparation_place_id = cloneDeep(guarnition.preparation_place_id);
              guarnition.value.preparation_place = cloneDeep(guarnition.preparation_place);
          } else {
              if(selectedGuarnition.value === guarnition.id) {
                  selectedGuarnition.value = null;
                  guarnition.value.name = null;
                  guarnition.value.preparation_place_id = null;
                  guarnition.value.preparation_place = null;
              } else {
                  selectedGuarnition.value = guarnition.id;
                  guarnition.value.name = cloneDeep(guarnition.name);
                  guarnition.value.preparation_place = cloneDeep(guarnition.preparation_place);
                  guarnition.value.preparation_place_id = cloneDeep(guarnition.preparation_place_id);
              }
          }
      };

    const loadInventoryConcepts = async () => {
      await getInventoryConcepts()
        .then((response) => {
          if (response.status === 200) {
            inventory_concepts.value = response.data;
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        });
    };

   const loadGuarnition = async () => {
      await getProductFittings()
        .then((response) => {
          if (response.status === 200) {
              guarnitionOptions.value = response.data
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        });
    };

   loadGuarnition()
    const performCreateInventoryConcept = async () => {
      await createInventoryConcept(inventory_concept.value)
        .then((response) => {
          if (response.status === 201) {
            loadInventoryConcepts();
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          inventory_concept.value = { description: "", concept_type: null };
        });
    };

    const performUpdateInventoryConcept = async () => {
      await updateInventoryConcept(
        selectedInventoryConcept.value,
        inventory_concept.value
      )
        .then((response) => {
          if (response.status === 200) {
            loadInventoryConcepts();
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          selectedInventoryConcept.value = null;
          inventory_concept.value = { description: "", concept_type: null };
        });
    };

    const performDeleteInventoryConcept = () => {
      if (!selectedInventoryConcept.value) return;
      dialog.error({
          title: "Eliminando concepto de inventario",
          content: "¿Está seguro?",
          positiveText: "Sí",
          onPositiveClick: async () => {
            await deleteInventoryConcept(selectedInventoryConcept.value)
              .then((response) => {
                if (response.status === 202) {
                    loadInventoryConcepts();
                }
              })
              .catch((error) => {
                console.error(error);
                message.error("Algo salió mal...");
              })
              .finally(() => {
                inventory_concept.value = { description: "", concept_type: null };
                selectedInventoryConcept.value = null;
              });
          }
      })
    };

    const performCreateGuarnition = async () => {
      await createGuarnition(guarnition.value)
        .then((response) => {
          if (response.status === 201) {
              loadGuarnition();
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          guarnition.value.name = "";
          guarnition.value.preparation_place_id = null;
        });
    };

    const performUpdateGuarnition = async () => {
      await updateGuarnition(
        selectedGuarnition.value,
        guarnition.value
      )
        .then((response) => {
          if (response.status === 200) {
              loadGuarnition();
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          guarnition.value.name = "";
          guarnition.value.preparation_place_id = null;
          selectedGuarnition.value = false;
        });
    };

    const performDeleteGuarnition = () => {
      if (!selectedGuarnition.value) return;
      dialog.error({
          title: "Eliminando guarnición",
          content: "¿Está seguro?",
          positiveText: "Sí",
          onPositiveClick: async () => {
            await deleteGuarnition(selectedGuarnition.value)
              .then((response) => {
                if (response.status === 204) {
                    loadGuarnition();
                }
              })
              .catch((error) => {
                console.error(error);
                message.error("Algo salió mal...");
              })
              .finally(() => {
                guarnition.value.name = "";
                guarnition.value.preparation_place_id = null;
                selectedGuarnition.value = false;
              });
          }
      })
    };

    onMounted(() => {
      tableStore.refreshData();
      loadPreparationPlaces();
      loadProductCategories();
      loadPaymentMethods();
      loadConcepts();
      loadInventoryConcepts();
    });

    const handleBack = () => {
      router.push({ name: "HomeSettings" });
    };

    return {
      userStore,
      handleBack,
      isLoadingData,
      areaOptions,
      currentArea,
      area,
      cleanArea,
      editArea,
      performCreateArea,
      performUpdateArea,
      performDeleteArea,
      selectTable,
      cleanTable,
      selectedTable,
      tables,
      performCreateTable,
      performUpdateTable,
      performDeleteTable,
      preparationPlaces,
      preparationPlace,
      printerStore,
      printerName,
      placesOptions,
      guarnitionOptions,
      printerFormat,
      printerFormatOptions,
      selectedPlace,
      selectPlace,
      performCreatePreparationPlace,
      performUpdatePreparationPlace,
      performDeletePreparationPlace,
      productCategories,
      guarnition,
      productCategory,
      is_disabled,
      selectedCategory,
      selectCategory,
      performCreateProductCategory,
      performUpdateProductCategory,
      paymentMethods,
      paymentMethod,
      selectedPayment,
      selectPaymentMethod,
      performCreatePaymentMethod,
      performUpdatePaymentMethod,
      performDeletePaymentMethod,
      conceptTypeOptions,
      concepts,
      concept,
      optionsPrinters,
      selectedConcept,
      selectConcept,
      performCreateConcept,
      performUpdateConcept,
      performDeleteConcept,
      inventory_concepts,
      inventory_concept,
      selectedGuarnition,
      selectedInventoryConcept,
      selectInventoryConcept,
      selectGuarnition,
      performCreateInventoryConcept,
      performUpdateInventoryConcept,
      performDeleteInventoryConcept,
      performCreateGuarnition,
      performUpdateGuarnition,
      performDeleteGuarnition,
      activeTab,
      tableVisualSettings,
      isSavingVisualSettings,
      tablePositionOptions,
      performSaveTableVisualSettings,
      previewState,
      previewCurrentColor,
      previewBackgroundStyle,
      previewBadgeStyle,
      previewStatusText,
    };
  },
});
</script>

<style lang="scss">
.vh-82 {
  height: 82vh !important;
}
.bg-selected {
  background-color: #eff6ff;
}

.general-settings-container {
  padding: 16px 20px;
  max-width: 1440px;
  margin: 0 auto;

  .settings-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;

      .back-btn {
        transition: transform 0.2s ease;
        &:hover {
          transform: translateX(-2px);
        }
      }

      .header-title {
        margin: 0;
        font-weight: 700;
        font-size: 1.5rem;
        line-height: 1.2;
        letter-spacing: -0.02em;
      }

      .header-subtitle {
        font-size: 0.875rem;
      }
    }
  }

  .settings-main-card {
    border-radius: 12px;
    box-shadow: 0 4px 16px -2px rgba(0, 0, 0, 0.05);

    .tab-pane-content {
      padding-top: 12px;
    }
  }

  .settings-subcard {
    border-radius: 10px;
    background-color: var(--n-color-embedded, #ffffff);
    height: 100%;
  }

  /* Control de tamaño de etiqueta con slider + input-number */
  .table-size-control-row {
    display: flex;
    align-items: center;
    gap: 16px;
    width: 100%;
    min-width: 0;

    .slider-wrapper {
      flex: 1;
      min-width: 140px;
      padding: 0 8px;
    }
  }

  /* Controles de selección de colores de estado */
  .color-picker-box {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 10px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);

    .color-picker-header {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 600;
      color: #334155;

      .color-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        display: inline-block;
        box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
      }
    }
  }

  /* Previsualización interactiva a tamaño real 1:1 */
  .table-preview-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: #f8fafc;
    border: 1px dashed #cbd5e1;
    border-radius: 12px;
    width: 100%;

    .table-real-card {
      width: 175px;
      min-height: 185px;
      border-radius: 12px !important;
      border: 1px solid rgba(0, 0, 0, 0.08) !important;
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
      padding: 8px 8px;
      box-sizing: border-box;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      user-select: none;
    }

    .preview-table-name {
      font-weight: 700;
      color: #1f2937;
      font-size: 0.95rem;
      max-width: 85px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      line-height: 1.2;

      &.preview-table-name-center {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-weight: 800;
        color: #1f2937;
        text-align: center;
        max-width: 88px;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2;
        pointer-events: none;
        background: transparent;
        white-space: normal;
        word-break: break-word;
      }
    }

    .preview-status-badge {
      font-size: 11px;
      font-weight: 600;
      padding: 2px 7px;
      border-radius: 999px;
      letter-spacing: 0.3px;
      display: inline-flex;
      align-items: center;
    }

    .preview-opt-btn {
      background: transparent;
      border: none;
      padding: 0;
      color: #9ca3af;
      cursor: default;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .preview-table-center {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100px;
    }

    .preview-real-table-img {
      max-height: 102px;
      max-width: 102px;
      width: auto;
      height: auto;
      object-fit: contain;
      opacity: 0.88;
    }

    .preview-card-footer {
      min-height: 28px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .preview-order-pill {
      background-color: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 6px;
      padding: 3px 6px;
      gap: 4px;
      min-height: 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-sizing: border-box;
    }

    .preview-order-amount {
      font-size: 0.88rem;
      font-weight: 800;
      color: #b91c1c;
      white-space: nowrap;
      line-height: 1;
    }

    .preview-order-time {
      font-size: 10.5px;
      color: #6b7280;
      font-weight: 500;
      display: flex;
      align-items: center;
      white-space: nowrap;
      line-height: 1;
    }

    .preview-free-hint {
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      color: #9ca3af;
      font-weight: 500;
      box-sizing: border-box;
    }

    .preview-caption {
      margin-top: 8px;
      font-size: 11px;
      text-align: center;
    }
  }

  /* Grid de mesas del área */
  .empty-state-notice {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 36px 16px;
    text-align: center;
  }

  .table-grid-card {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 12px 8px;
    background: #ffffff;
    border: 1.5px solid #e2e8f0;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    user-select: none;

    &:hover {
      border-color: #93c5fd;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.08);
    }

    &.is-selected {
      border-color: #3b82f6;
      background-color: #eff6ff;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }

    .table-card-icon {
      color: #64748b;
      margin-bottom: 4px;
    }

    .table-card-code {
      font-weight: 700;
      color: #1e293b;
      line-height: 1.2;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
    }
  }

  /* Listas en las demás pestañas */
  .settings-list {
    background: transparent;

    .item-selected {
      background-color: #eff6ff !important;
      border-left: 3px solid #3b82f6;
    }
  }
}
</style>
