<template>
  <div id="KioskPromotions">
    <!-- Header -->
    <n-space align="center" justify="space-between" class="mb-3">
      <div class="d-flex align-items-center gap-2">
        <n-button circle @click="handleBack" size="large" quaternary class="back-btn">
          <template #icon><v-icon name="md-arrowback-round" /></template>
        </n-button>
        <div>
          <n-h1 class="m-0">
            <n-text>Promociones de Autoservicio</n-text>
          </n-h1>
          <n-text depth="3" class="fs-7">
            Gestiona los anuncios, combos y ofertas con descuento visibles en el quiosco
          </n-text>
        </div>
      </div>
      <n-space>
        <n-button secondary :loading="loading" @click="loadPromotions">
          <template #icon><v-icon name="hi-solid-refresh" /></template>
          Actualizar
        </n-button>
        <n-button type="primary" @click="openCreateModal">
          <template #icon><v-icon name="md-add-round" /></template>
          Nueva Promoción
        </n-button>
      </n-space>
    </n-space>

    <!-- Table of Promotions -->
    <n-card class="shadow-sm">
      <n-data-table
        :columns="columns"
        :data="promotions"
        :loading="loading"
        :row-key="(row) => row.id"
        size="small"
        :pagination="{ pageSize: 10 }"
      />
    </n-card>
    <!-- Modal Form: Create / Edit -->
    <n-modal
      v-model:show="showModal"
      preset="card"
      :title="isEditing ? 'Editar Promoción de Autoservicio' : 'Nueva Promoción de Autoservicio'"
      style="max-width: 1140px; width: 95vw;"
      content-style="max-height: 84vh; overflow-y: auto; padding: 20px 24px;"
      :mask-closable="false"
    >
      <n-form ref="formRef" :model="form" :rules="rules" label-placement="top">
        <n-grid :cols="12" :x-gap="24" :y-gap="16">
          <!-- Columna Izquierda: Configuraciones Modulares (7 cols) -->
          <n-gi :span="7">
            <n-tabs v-model:value="activeModalTab" type="segment" animated class="mb-3">
              <!-- TAB 1: CONTENIDO Y VINCULACIÓN -->
              <n-tab-pane name="content">
                <template #tab>
                  <div class="d-flex align-items-center gap-2">
                    <v-icon name="md-description-twotone" />
                    <span>Contenido y Enlace</span>
                  </div>
                </template>

                <n-grid :cols="2" :x-gap="16" :y-gap="14">
                  <n-gi :span="2">
                    <n-form-item label="Título del Anuncio / Oferta" path="title" required>
                      <n-input v-model:value="form.title" placeholder="Ej. ¡Super Combo Familiar!" size="large" />
                    </n-form-item>
                  </n-gi>

                  <n-gi :span="2">
                    <n-form-item label="Subtítulo / Breve Descripción">
                      <n-input
                        v-model:value="form.subtitle"
                        placeholder="Ej. Pizza Grande + Bebida 1.5L + Papas Crujientes"
                      />
                    </n-form-item>
                  </n-gi>

                  <n-gi :span="2">
                    <n-form-item label="¿A qué producto o combo dirige este anuncio?">
                      <n-radio-group v-model:value="targetType" @update:value="handleTargetTypeChange" class="w-100">
                        <n-radio-button value="PRODUCT" style="width: 33.3%; text-align: center;">
                          <div class="d-flex align-items-center justify-content-center gap-1">
                            <v-icon name="md-fastfood-twotone" />
                            <span>Producto</span>
                          </div>
                        </n-radio-button>
                        <n-radio-button value="COMBO" style="width: 33.3%; text-align: center;">
                          <div class="d-flex align-items-center justify-content-center gap-1">
                            <v-icon name="gi-hot-meal" />
                            <span>Combo</span>
                          </div>
                        </n-radio-button>
                        <n-radio-button value="NONE" style="width: 33.3%; text-align: center;">
                          <div class="d-flex align-items-center justify-content-center gap-1">
                            <v-icon name="md-campaign-round" />
                            <span>Solo Anuncio</span>
                          </div>
                        </n-radio-button>
                      </n-radio-group>
                    </n-form-item>
                  </n-gi>

                  <!-- Si es Producto -->
                  <template v-if="targetType === 'PRODUCT'">
                    <n-gi :span="1">
                      <n-form-item label="Filtrar por Categoría">
                        <n-select
                          v-model:value="selectedCategoryFilter"
                          :options="categoryOptions"
                          clearable
                          placeholder="Todas las categorías"
                        />
                      </n-form-item>
                    </n-gi>
                    <n-gi :span="1">
                      <n-form-item label="Producto Seleccionado" required>
                        <n-select
                          v-model:value="form.product"
                          :options="filteredProductOptions"
                          filterable
                          :filter="filterProductOption"
                          placeholder="Buscar producto..."
                          @update:value="onProductSelected"
                        />
                      </n-form-item>
                    </n-gi>
                  </template>

                  <!-- Si es Combo -->
                  <template v-if="targetType === 'COMBO'">
                    <n-gi :span="2">
                      <n-form-item label="Combo Seleccionado" required>
                        <n-select
                          v-model:value="form.combo"
                          :options="comboOptions"
                          filterable
                          :filter="filterComboOption"
                          placeholder="Selecciona el combo a vincular"
                          @update:value="onComboSelected"
                        />
                      </n-form-item>
                    </n-gi>
                  </template>

                  <!-- Precio Promocional y Descuento -->
                  <n-gi :span="targetType !== 'NONE' ? 1 : 2">
                    <n-form-item label="Precio Promocional en Quiosco (S/)">
                      <n-input-number
                        v-model:value="form.promo_price"
                        :min="0"
                        :precision="2"
                        placeholder="Dejar vacío para precio regular"
                        class="w-100"
                      />
                    </n-form-item>
                  </n-gi>

                  <n-gi :span="1" v-if="targetType !== 'NONE' && selectedOriginalPrice">
                    <div class="p-2 border rounded bg-light mt-1">
                      <div class="d-flex justify-content-between align-items-center">
                        <span class="fs-8 text-muted">Precio Regular:</span>
                        <span class="fw-bold text-decoration-line-through">S/ {{ selectedOriginalPrice.toFixed(2) }}</span>
                      </div>
                      <div v-if="calculatedDiscountPercent && calculatedDiscountPercent > 0" class="d-flex justify-content-between align-items-center mt-1">
                        <span class="fs-8 text-success fw-bold">Ahorro: {{ calculatedDiscountPercent }}%</span>
                        <n-button size="tiny" type="primary" secondary @click="applyCalculatedBadge">
                          Usar "{{ calculatedDiscountPercent }}% OFF"
                        </n-button>
                      </div>
                    </div>
                  </n-gi>
                </n-grid>
              </n-tab-pane>

              <!-- TAB 2: DISEÑO Y COLOR DE FONDO -->
              <n-tab-pane name="design">
                <template #tab>
                  <div class="d-flex align-items-center gap-2">
                    <v-icon name="md-palette-round" />
                    <span>Diseño y Colores</span>
                  </div>
                </template>

                <n-grid :cols="2" :x-gap="16" :y-gap="14">
                  <!-- Insignia / Badge -->
                  <n-gi :span="2">
                    <n-form-item label="Texto de Insignia Destacada (Badge)">
                      <n-input v-model:value="form.badge_text" placeholder="Ej. 30% OFF, 2x1, POPULAR, PREMIUM" />
                      <div class="mt-2 d-flex flex-wrap gap-1 align-items-center">
                        <span class="text-muted fs-8 me-1">Sugerencias:</span>
                        <n-tag
                          v-for="badge in ['30% OFF', 'POPULAR', 'PREMIUM', 'NUEVO', '2x1', 'OFERTA', 'DEL DÍA']"
                          :key="badge"
                          size="small"
                          round
                          checkable
                          :checked="form.badge_text === badge"
                          @click="form.badge_text = badge"
                          style="cursor: pointer;"
                        >
                          {{ badge }}
                        </n-tag>
                      </div>
                    </n-form-item>
                  </n-gi>

                  <!-- Modo de Fondo: Colores o Imagen -->
                  <n-gi :span="2">
                    <n-form-item label="Tipo de Fondo del Banner">
                      <n-radio-group v-model:value="colorMode" @update:value="onColorModeChange">
                        <n-radio-button value="gradient">
                          <div class="d-flex align-items-center gap-1">
                            <v-icon name="md-gradient-round" />
                            <span>Degradado Dinámico</span>
                          </div>
                        </n-radio-button>
                        <n-radio-button value="solid">
                          <div class="d-flex align-items-center gap-1">
                            <v-icon name="md-formatpaint-round" />
                            <span>Color Sólido</span>
                          </div>
                        </n-radio-button>
                        <n-radio-button value="image">
                          <div class="d-flex align-items-center gap-1">
                            <v-icon name="md-image-round" />
                            <span>Imagen con Sombreado</span>
                          </div>
                        </n-radio-button>
                      </n-radio-group>
                    </n-form-item>
                  </n-gi>

                  <!-- CONFIGURACIÓN PARA MODO IMAGEN FOTOGRÁFICA -->
                  <template v-if="colorMode === 'image'">
                    <n-gi :span="2">
                      <div class="p-3 border rounded-3 bg-light">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                          <label class="form-label fs-7 fw-bold mb-0">Imagen para el Banner Promocional</label>
                          <span class="fs-8 text-muted">Formatos: JPG, PNG, WEBP</span>
                        </div>

                        <!-- Si el producto o combo seleccionado ya tiene imagen en BD -->
                        <div v-if="selectedTargetImage" class="p-2 mb-3 border rounded bg-white d-flex align-items-center justify-content-between gap-3 shadow-sm">
                          <div class="d-flex align-items-center gap-3">
                            <img :src="selectedTargetImage" alt="Target" style="width: 46px; height: 46px; object-fit: cover; border-radius: 8px; border: 1px solid #e2e8f0;" />
                            <div>
                              <div class="fw-bold fs-8">Foto de {{ targetType === 'PRODUCT' ? 'Producto' : 'Combo' }} Vinculado</div>
                              <div class="text-muted fs-8">Disponible desde la base de datos de Flizzy</div>
                            </div>
                          </div>
                          <n-button
                            size="small"
                            type="primary"
                            secondary
                            @click="useSelectedTargetImage"
                          >
                            Usar esta Foto
                          </n-button>
                        </div>

                        <!-- Selector y Subida de Archivo Personalizado -->
                        <div class="d-flex align-items-center gap-3 flex-wrap">
                          <n-upload
                            ref="uploadRef"
                            :max="1"
                            accept="image/*"
                            :default-upload="false"
                            :show-file-list="false"
                            @change="handleImageFileChange"
                          >
                            <n-button secondary type="info">
                              <template #icon>
                                <v-icon name="md-image-round" />
                              </template>
                              {{ form.image_preview ? 'Cambiar Imagen' : 'Subir Imagen desde el Equipo' }}
                            </n-button>
                          </n-upload>

                          <n-button
                            v-if="form.image_preview || form.image_file"
                            size="small"
                            quaternary
                            type="error"
                            @click="clearImage"
                          >
                            Quitar Imagen
                          </n-button>
                        </div>

                        <div v-if="form.image_preview" class="mt-2 text-success fs-8 fw-bold">
                          ✓ Imagen activa para el fondo del banner
                        </div>
                      </div>
                    </n-gi>

                    <!-- Control Deslizante de Sombreado / Oscurecimiento (Overlay) -->
                    <n-gi :span="2">
                      <div class="p-3 border rounded-3 bg-white shadow-sm">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                          <div class="d-flex align-items-center gap-2">
                            <v-icon name="md-opacity-round" class="text-primary" />
                            <label class="form-label fs-7 fw-bold mb-0">Sombreado / Oscurecimiento de Imagen</label>
                          </div>
                          <span class="badge bg-primary fs-7">{{ Math.round((form.overlay_opacity ?? 0.45) * 100) }}% Sombreado</span>
                        </div>
                        <p class="text-muted fs-8 mb-3">
                          Ajusta la opacidad del sombreado para que los textos, precios e insignias resalten con nitidez sobre cualquier foto.
                        </p>

                        <n-slider
                          v-model:value="form.overlay_opacity"
                          :min="0.10"
                          :max="0.85"
                          :step="0.05"
                          :marks="{ 0.20: 'Claro (20%)', 0.45: 'Recomendado (45%)', 0.75: 'Oscuro (75%)' }"
                        />
                      </div>
                    </n-gi>
                  </template>

                  <!-- CONFIGURACIÓN PARA MODO COLOR / DEGRADADO -->
                  <template v-else>
                    <!-- Paletas Rápidas -->
                    <n-gi :span="2">
                      <div class="mb-2">
                        <label class="form-label fs-8 text-muted mb-2 d-block">Paletas Cromáticas Rápidas:</label>
                        <div class="d-flex flex-wrap gap-2">
                          <button
                            v-for="p in colorPresets"
                            :key="p.name"
                            type="button"
                            class="btn btn-sm text-white px-3 py-1 rounded-pill shadow-sm"
                            @click="applyColorPreset(p)"
                            :style="{ background: `linear-gradient(135deg, ${p.start}, ${p.end})`, border: 'none', fontSize: '11px', fontWeight: 'bold' }"
                          >
                            {{ p.name }}
                          </button>
                        </div>
                      </div>
                    </n-gi>

                    <!-- Selectores de Color -->
                    <template v-if="colorMode === 'gradient'">
                      <n-gi :span="1">
                        <n-form-item label="Color Inicial (Izquierda)">
                          <div class="d-flex align-items-center gap-2 w-100">
                            <n-color-picker
                              v-model:value="form.gradient_color_start"
                              :show-alpha="false"
                              :modes="['hex']"
                              style="width: 100px;"
                            />
                            <n-input v-model:value="form.gradient_color_start" placeholder="#FF6B00" />
                          </div>
                        </n-form-item>
                      </n-gi>
                      <n-gi :span="1">
                        <n-form-item label="Color Final (Derecha)">
                          <div class="d-flex align-items-center gap-2 w-100">
                            <n-color-picker
                              v-model:value="form.gradient_color_end"
                              :show-alpha="false"
                              :modes="['hex']"
                              style="width: 100px;"
                            />
                            <n-input v-model:value="form.gradient_color_end" placeholder="#E11D48" />
                          </div>
                        </n-form-item>
                      </n-gi>
                    </template>

                    <template v-else>
                      <n-gi :span="2">
                        <n-form-item label="Color de Fondo Sólido">
                          <div class="d-flex align-items-center gap-2" style="max-width: 380px;">
                            <n-color-picker
                              :value="form.gradient_color_start"
                              @update:value="handleColorStartChange"
                              :show-alpha="false"
                              :modes="['hex']"
                              style="width: 120px;"
                            />
                            <n-input
                              :value="form.gradient_color_start"
                              @update:value="handleColorStartChange"
                              placeholder="#FF6B00"
                            />
                          </div>
                        </n-form-item>
                      </n-gi>
                    </template>
                  </template>
                </n-grid>
              </n-tab-pane>

              <!-- TAB 3: VISIBILIDAD Y REGLAS -->
              <n-tab-pane name="visibility">
                <template #tab>
                  <div class="d-flex align-items-center gap-2">
                    <v-icon name="md-viewcarousel-twotone" />
                    <span>Visibilidad y Canales</span>
                  </div>
                </template>

                <n-grid :cols="2" :x-gap="16" :y-gap="16">
                  <n-gi :span="2">
                    <n-form-item label="Prioridad en el Carrusel (Mayor número aparece primero)">
                      <n-input-number v-model:value="form.order_priority" :min="0" :max="100" class="w-100" />
                    </n-form-item>
                  </n-gi>

                  <n-gi :span="2">
                    <div class="p-3 border rounded-3 bg-light">
                      <div class="alert py-2 px-3 mb-3 border-0 rounded-3 d-flex align-items-center gap-2" style="background-color: #e0f2fe; color: #0369a1;">
                        <v-icon name="md-infomation-round" scale="1.1" />
                        <div class="fs-8">
                          <strong>Consejo de Visualización:</strong> Las promociones con imágenes grandes o de formato Hero se lucen mejor en la <strong>Pantalla de Bienvenida</strong>. Si activas <strong>Pantalla del Catálogo</strong>, se mostrará como un banner compacto para no quitar espacio a la carta.
                        </div>
                      </div>
                      <h6 class="fw-bold mb-3 fs-7 text-dark">Canales de Visualización en el Quiosco</h6>
                      <div class="d-flex flex-column gap-3">
                        <div class="d-flex justify-content-between align-items-center">
                          <div>
                            <div class="fw-bold fs-7">Pantalla de Bienvenida (Inicio del Quiosco)</div>
                            <div class="text-muted fs-8">Aparece en el gran carrusel táctil de bienvenida</div>
                          </div>
                          <n-switch v-model:value="form.show_in_welcome" />
                        </div>
                        <hr class="my-1 text-muted opacity-25" />
                        <div class="d-flex justify-content-between align-items-center">
                          <div>
                            <div class="fw-bold fs-7">Pantalla del Catálogo (Navegación de Productos)</div>
                            <div class="text-muted fs-8">Aparece como banner superior interactivo en la tienda</div>
                          </div>
                          <n-switch v-model:value="form.show_in_catalog" />
                        </div>
                        <hr class="my-1 text-muted opacity-25" />
                        <div class="d-flex justify-content-between align-items-center">
                          <div>
                            <div class="fw-bold fs-7">Estado Activo</div>
                            <div class="text-muted fs-8">Habilita o pausa la visualización inmediata de esta promoción</div>
                          </div>
                          <n-switch v-model:value="form.is_active" />
                        </div>
                      </div>
                    </div>
                  </n-gi>
                </n-grid>
              </n-tab-pane>
            </n-tabs>
          </n-gi>

          <!-- Columna Derecha: Panel de Simulación Kiosco en Vivo (5 cols) -->
          <n-gi :span="5">
            <div class="p-3 border rounded-4 bg-light shadow-sm" style="position: sticky; top: 0;">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <div class="d-flex align-items-center gap-2">
                  <v-icon name="md-pointofsale-twotone" class="text-primary" />
                  <span class="fw-bold fs-7 text-dark">Simulación en Quiosco</span>
                </div>
                <span class="badge bg-success text-white fs-8">
                  Tiempo Real
                </span>
              </div>

              <!-- Tarjeta de Anuncio 1:1 con Sombreado Dinámico -->
              <div
                class="preview-card p-3 text-white rounded-4 shadow mb-3 position-relative overflow-hidden"
                :style="previewCardStyle"
              >
                <!-- Capa de Sombreado si tiene imagen -->
                <div
                  v-if="effectivePreviewImage && colorMode === 'image'"
                  class="position-absolute top-0 start-0 w-100 h-100"
                  :style="previewOverlayStyle"
                />

                <!-- Círculos decorativos translúcidos si no tiene imagen (Estilo preferido) -->
                <template v-if="!effectivePreviewImage || colorMode !== 'image'">
                  <div
                    class="position-absolute rounded-circle"
                    style="top: -25px; right: -25px; width: 110px; height: 110px; background: rgba(255,255,255,0.08); pointer-events: none; z-index: 1;"
                  />
                  <div
                    class="position-absolute rounded-circle"
                    style="bottom: -35px; right: 25px; width: 140px; height: 140px; background: rgba(255,255,255,0.06); pointer-events: none; z-index: 1;"
                  />
                </template>

                <div class="d-flex justify-content-between align-items-center position-relative" style="z-index: 2;">
                  <div style="flex: 1;">
                    <div v-if="form.badge_text" class="mb-2">
                      <span
                        class="preview-badge-pill px-2 py-1 rounded-pill fw-bold"
                        :style="{
                          backgroundColor: form.badge_color || '#e11d48',
                          color: '#ffffff',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                          border: '1px solid rgba(255,255,255,0.45)',
                          fontSize: '11px',
                          letterSpacing: '0.5px',
                          display: 'inline-block'
                        }"
                      >
                        {{ form.badge_text }}
                      </span>
                    </div>
                    <h4 class="preview-title fw-bold m-0 fs-6">{{ form.title || 'Título de Promoción' }}</h4>
                    <p class="preview-subtitle small m-0 mt-1 fs-8">{{ form.subtitle || 'Subtítulo o combo especial' }}</p>
                    <div class="mt-2 d-flex align-items-baseline gap-2" v-if="form.promo_price">
                      <span
                        class="preview-price-badge px-2 py-1 rounded-pill fw-bold fs-7"
                        :style="{
                          backgroundColor: '#ffffff',
                          color: (effectivePreviewImage && colorMode === 'image') ? '#FF6B00' : form.gradient_color_start,
                          boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                        }"
                      >
                        S/ {{ Number(form.promo_price).toFixed(2) }}
                      </span>
                      <span v-if="selectedOriginalPrice && selectedOriginalPrice > form.promo_price" class="preview-old-price fs-8">
                        S/ {{ selectedOriginalPrice.toFixed(2) }}
                      </span>
                    </div>
                  </div>
                  <div class="ms-2 text-center" style="z-index: 2;">
                    <div
                      v-if="effectivePreviewImage && colorMode === 'image'"
                      class="preview-cta-btn p-2 text-center"
                      style="background: rgba(34,34,34,0.72); border: 1.5px solid rgba(255,255,255,0.7); border-radius: 12px; min-width: 68px;"
                    >
                      <v-icon name="md-add-round" scale="1.2" class="text-white" />
                      <div style="font-size: 8.5px; font-weight: 800; line-height: 1.1; letter-spacing: 0.5px;" class="mt-1 text-white">PEDIR<br>AHORA</div>
                    </div>
                    <div v-else class="d-flex flex-column align-items-center gap-2">
                      <div
                        class="d-flex align-items-center justify-content-center rounded-circle"
                        style="width: 38px; height: 38px; background: rgba(255,255,255,0.18); border: 1.5px solid rgba(255,255,255,0.40);"
                      >
                        <v-icon name="md-restaurant-round" scale="1.2" class="text-white" />
                      </div>
                      <div
                        class="preview-cta-btn-solid px-2 py-1 rounded-pill fw-bold shadow-sm d-flex align-items-center gap-1"
                        :style="{ backgroundColor: '#ffffff', color: form.gradient_color_start, fontSize: '9.5px', letterSpacing: '0.5px' }"
                      >
                        <v-icon name="md-add-round" scale="0.9" />
                        <span>PEDIR</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Resumen Contextual de Canales y Destino -->
              <div class="p-3 bg-white border rounded-3">
                <div class="text-muted fs-8 fw-bold mb-2 text-uppercase">Resumen de Configuración:</div>
                <div class="d-flex flex-column gap-2 fs-8">
                  <div class="d-flex justify-content-between">
                    <span class="text-muted">Destino:</span>
                    <span class="fw-bold text-dark text-truncate" style="max-width: 170px;">{{ selectedTargetName }}</span>
                  </div>
                  <div class="d-flex justify-content-between">
                    <span class="text-muted">Canales:</span>
                    <div class="d-flex gap-1">
                      <span class="badge" :class="form.show_in_welcome ? 'bg-primary' : 'bg-light text-muted border'">Bienvenida</span>
                      <span class="badge" :class="form.show_in_catalog ? 'bg-primary' : 'bg-light text-muted border'">Catálogo</span>
                    </div>
                  </div>
                  <div class="d-flex justify-content-between" v-if="form.badge_text">
                    <span class="text-muted">Insignia:</span>
                    <span class="badge bg-warning text-dark fw-bold">{{ form.badge_text }}</span>
                  </div>
                  <div class="d-flex justify-content-between">
                    <span class="text-muted">Estado:</span>
                    <span :class="form.is_active ? 'text-success fw-bold' : 'text-danger fw-bold'">
                      {{ form.is_active ? '● Activa en quiosco' : '○ Pausada' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </n-gi>
        </n-grid>
      </n-form>

      <template #action>
        <n-space justify="end" class="mt-2">
          <n-button @click="showModal = false">Cancelar</n-button>
          <n-button type="primary" :loading="saving" @click="handleSave">
            Guardar Promoción
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { h, onMounted, ref, reactive, computed } from "vue";
import { useRouter } from "vue-router";
import {
  NButton,
  NTag,
  NSwitch,
  NColorPicker,
  NTabs,
  NTabPane,
  NRadioGroup,
  NRadioButton,
  NSlider,
  NUpload,
  useMessage,
  useDialog,
} from "naive-ui";
import {
  getKioskPromotions,
  createKioskPromotion,
  updateKioskPromotion,
  toggleKioskPromotionActive,
  deleteKioskPromotion,
  getProductsAll,
  getCombos,
  getCategories,
} from "@/api/modules/products";

const router = useRouter();
const message = useMessage();
const dialog = useDialog();

const loading = ref(false);
const saving = ref(false);
const showModal = ref(false);
const isEditing = ref(false);
const editingId = ref(null);
const formRef = ref(null);

const activeModalTab = ref("content");
const colorMode = ref("gradient");

const promotions = ref([]);
const productOptions = ref([]);
const comboOptions = ref([]);
const categoryOptions = ref([]);
const selectedCategoryFilter = ref(null);
const targetType = ref("PRODUCT");

const filteredProductOptions = computed(() => {
  if (!selectedCategoryFilter.value) {
    return productOptions.value;
  }
  return productOptions.value.filter(
    (p) => p.category === selectedCategoryFilter.value
  );
});

const filterProductOption = (pattern, option) => {
  if (!pattern) return true;
  const clean = (str) =>
    (str || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

  const p = clean(pattern);
  const label = clean(option.label);
  const name = clean(option.name);
  const singular = p.length > 3 && p.endsWith("s") ? p.slice(0, -1) : p;

  return (
    label.includes(p) ||
    name.includes(p) ||
    label.includes(singular) ||
    name.includes(singular)
  );
};

const filterComboOption = (pattern, option) => {
  if (!pattern) return true;
  const clean = (str) =>
    (str || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

  const p = clean(pattern);
  const label = clean(option.label);
  const singular = p.length > 3 && p.endsWith("s") ? p.slice(0, -1) : p;
  return label.includes(p) || label.includes(singular);
};

const targetTypeOptions = [
  { label: "Producto", value: "PRODUCT" },
  { label: "Combo", value: "COMBO" },
  { label: "Solo Anuncio (Informativo)", value: "NONE" },
];

const colorPresets = [
  { name: "Flizzy Naranja", start: "#FF6B00", end: "#E11D48" },
  { name: "Rojo Pizza", start: "#B91C1C", end: "#DC2626" },
  { name: "Púrpura Chicha", start: "#581C87", end: "#7E22CE" },
  { name: "Oro Maracuyá", start: "#D97706", end: "#F59E0B" },
  { name: "Azul Refresco", start: "#0369A1", end: "#0EA5E9" },
  { name: "Verde Oferta", start: "#047857", end: "#10B981" },
  { name: "Carbón Gourmet", start: "#1E293B", end: "#0F172A" },
  { name: "Rosa Delicia", start: "#DB2777", end: "#F43F5E" },
];

const onColorModeChange = (mode) => {
  colorMode.value = mode;
  if (mode === "solid") {
    form.gradient_color_end = form.gradient_color_start;
  }
};

const handleColorStartChange = (val) => {
  form.gradient_color_start = val;
  if (colorMode.value === "solid") {
    form.gradient_color_end = val;
  }
};

const applyColorPreset = (p) => {
  form.gradient_color_start = p.start;
  form.gradient_color_end = p.end;
  colorMode.value = p.start === p.end ? "solid" : "gradient";
};

const selectedOriginalPrice = computed(() => {
  if (targetType.value === "PRODUCT" && form.product) {
    const prod = productOptions.value.find((p) => p.value === form.product);
    return prod ? Number(prod.price || 0) : null;
  }
  if (targetType.value === "COMBO" && form.combo) {
    const c = comboOptions.value.find((item) => item.value === form.combo);
    return c ? Number(c.price || 0) : null;
  }
  return null;
});

const calculatedDiscountPercent = computed(() => {
  const orig = selectedOriginalPrice.value;
  const promo = form.promo_price;
  if (orig && promo && orig > promo) {
    return Math.round(((orig - promo) / orig) * 100);
  }
  return null;
});

const selectedTargetName = computed(() => {
  if (targetType.value === "PRODUCT" && form.product) {
    const prod = productOptions.value.find((p) => p.value === form.product);
    return prod ? prod.label : "Producto seleccionado";
  }
  if (targetType.value === "COMBO" && form.combo) {
    const c = comboOptions.value.find((item) => item.value === form.combo);
    return c ? c.label : "Combo seleccionado";
  }
  if (targetType.value === "NONE") {
    return "Solo Anuncio (Informativo)";
  }
  return "Sin seleccionar";
});

const selectedTargetImage = computed(() => {
  if (targetType.value === "PRODUCT" && form.product) {
    const prod = productOptions.value.find((p) => p.value === form.product);
    return prod?.image || null;
  }
  if (targetType.value === "COMBO" && form.combo) {
    const c = comboOptions.value.find((item) => item.value === form.combo);
    return c?.image || null;
  }
  return null;
});

const effectivePreviewImage = computed(() => {
  if (form.image_preview) return form.image_preview;
  if (form.image_url) return form.image_url;
  if (selectedTargetImage.value) return selectedTargetImage.value;
  return null;
});

const previewCardStyle = computed(() => {
  if (colorMode.value === "image" && effectivePreviewImage.value) {
    return {
      backgroundImage: `url(${effectivePreviewImage.value})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      minHeight: "140px",
    };
  }
  if (colorMode.value === "solid") {
    return {
      backgroundColor: form.gradient_color_start,
      minHeight: "140px",
    };
  }
  return {
    background: `linear-gradient(135deg, ${form.gradient_color_start}, ${form.gradient_color_end})`,
    minHeight: "140px",
  };
});

const previewOverlayStyle = computed(() => {
  const op = form.overlay_opacity ?? 0.45;
  const bottomMax = Math.min(0.96, op * 1.8);
  const bottomMid = Math.min(0.85, op * 1.1);
  return {
    background: `linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,${bottomMid}) 65%, rgba(0,0,0,${bottomMax}) 100%)`,
    pointerEvents: "none",
  };
});

const handleImageFileChange = ({ file }) => {
  if (file?.file) {
    form.image_file = file.file;
    form.image_preview = URL.createObjectURL(file.file);
    colorMode.value = "image";
  }
};

const clearImage = () => {
  form.image_file = null;
  form.image_preview = null;
  form.image_url = null;
  colorMode.value = "gradient";
};

const useSelectedTargetImage = () => {
  if (selectedTargetImage.value) {
    form.image_preview = selectedTargetImage.value;
    colorMode.value = "image";
    message.success("Foto vinculada al banner correctamente");
  }
};

const applyCalculatedBadge = () => {
  if (calculatedDiscountPercent.value) {
    form.badge_text = `${calculatedDiscountPercent.value}% OFF`;
  }
};

const defaultForm = () => ({
  title: "",
  subtitle: "",
  badge_text: "OFERTA",
  product: null,
  combo: null,
  promo_price: null,
  gradient_color_start: "#FF6B00",
  gradient_color_end: "#E11D48",
  overlay_opacity: 0.45,
  order_priority: 0,
  is_active: true,
  show_in_welcome: true,
  show_in_catalog: true,
  image_file: null,
  image_preview: null,
  image_url: null,
});

const form = reactive(defaultForm());

const rules = {
  title: [{ required: true, message: "El título es obligatorio", trigger: "blur" }],
};

const handleBack = () => {
  router.push({ name: "HomeSettings" });
};

const handleTargetTypeChange = (val) => {
  if (val === "PRODUCT") form.combo = null;
  else if (val === "COMBO") form.product = null;
  else {
    form.product = null;
    form.combo = null;
  }
};

const onProductSelected = (prodId) => {
  const prod = productOptions.value.find((p) => p.value === prodId);
  if (prod && !form.title) {
    form.title = prod.label;
  }
};

const onComboSelected = (comboId) => {
  const c = comboOptions.value.find((item) => item.value === comboId);
  if (c && !form.title) {
    form.title = c.label;
  }
};

const loadPromotions = async () => {
  loading.value = true;
  try {
    const res = await getKioskPromotions();
    promotions.value = res.data?.results || res.data || [];
  } catch (error) {
    message.error("Error al cargar promociones de autoservicio");
  } finally {
    loading.value = false;
  }
};

const loadCatalogData = async () => {
  try {
    const [prodRes, comboRes, catRes] = await Promise.all([
      getProductsAll(false),
      getCombos({ is_active: true }),
      getCategories({ is_disabled: false }),
    ]);

    const cats = catRes.data?.results || catRes.data || [];
    const catMap = {};
    cats.forEach((c) => {
      catMap[c.id] = c.description;
    });
    categoryOptions.value = [
      { label: "Todas las categorías", value: null },
      ...cats.map((c) => ({ label: c.description, value: c.id })),
    ];

    const prods = prodRes.data?.results || prodRes.data || [];
    productOptions.value = prods.map((p) => {
      const catName = catMap[p.category] || "";
      return {
        label: catName ? `[${catName}] ${p.name} - S/ ${Number(p.prices || 0).toFixed(2)}` : `${p.name} - S/ ${Number(p.prices || 0).toFixed(2)}`,
        value: p.id,
        price: p.prices,
        category: p.category,
        name: p.name,
        image: p.image || p.image_url,
      };
    });

    const combos = comboRes.data?.results || comboRes.data || [];
    comboOptions.value = combos.map((c) => ({
      label: `${c.name} - S/ ${Number(c.fixed_price || 0).toFixed(2)}`,
      value: c.id,
      price: c.fixed_price,
      image: c.image || c.image_url,
    }));
  } catch (err) {
    console.error("Error al cargar catálogo en promociones:", err);
  }
};

const openCreateModal = () => {
  isEditing.value = false;
  editingId.value = null;
  selectedCategoryFilter.value = null;
  activeModalTab.value = "content";
  colorMode.value = "gradient";
  Object.assign(form, defaultForm());
  targetType.value = "PRODUCT";
  showModal.value = true;
};

const openEditModal = (row) => {
  isEditing.value = true;
  editingId.value = row.id;
  selectedCategoryFilter.value = null;
  activeModalTab.value = "content";
  const start = row.gradient_color_start || "#FF6B00";
  const end = row.gradient_color_end || "#E11D48";
  const hasImg = !!(row.image || row.product_image || row.combo_image);
  colorMode.value = hasImg ? "image" : ((start.toLowerCase() === end.toLowerCase()) ? "solid" : "gradient");

  Object.assign(form, {
    title: row.title,
    subtitle: row.subtitle || "",
    badge_text: row.badge_text || "",
    product: row.product,
    combo: row.combo,
    promo_price: row.promo_price ? Number(row.promo_price) : null,
    gradient_color_start: start,
    gradient_color_end: end,
    overlay_opacity: row.overlay_opacity !== undefined && row.overlay_opacity !== null ? Number(row.overlay_opacity) : 0.45,
    order_priority: row.order_priority || 0,
    is_active: row.is_active,
    show_in_welcome: row.show_in_welcome,
    show_in_catalog: row.show_in_catalog,
    image_file: null,
    image_preview: row.image || row.product_image || row.combo_image || null,
    image_url: row.image || null,
  });

  if (row.product) targetType.value = "PRODUCT";
  else if (row.combo) targetType.value = "COMBO";
  else targetType.value = "NONE";

  showModal.value = true;
};

const handleSave = async () => {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }

  saving.value = true;
  try {
    let payload;
    if (form.image_file instanceof File) {
      payload = new FormData();
      payload.append("title", form.title);
      payload.append("subtitle", form.subtitle || "");
      payload.append("badge_text", form.badge_text || "");
      if (targetType.value === "PRODUCT" && form.product) {
        payload.append("product", form.product);
      }
      if (targetType.value === "COMBO" && form.combo) {
        payload.append("combo", form.combo);
      }
      if (form.promo_price !== null && form.promo_price !== undefined) {
        payload.append("promo_price", form.promo_price);
      }
      payload.append("gradient_color_start", form.gradient_color_start);
      payload.append("gradient_color_end", form.gradient_color_end);
      payload.append("overlay_opacity", form.overlay_opacity ?? 0.45);
      payload.append("order_priority", form.order_priority || 0);
      payload.append("is_active", form.is_active);
      payload.append("show_in_welcome", form.show_in_welcome);
      payload.append("show_in_catalog", form.show_in_catalog);
      payload.append("image", form.image_file);
    } else {
      payload = {
        title: form.title,
        subtitle: form.subtitle,
        badge_text: form.badge_text,
        product: targetType.value === "PRODUCT" ? form.product : null,
        combo: targetType.value === "COMBO" ? form.combo : null,
        promo_price: form.promo_price || null,
        gradient_color_start: form.gradient_color_start,
        gradient_color_end: form.gradient_color_end,
        overlay_opacity: form.overlay_opacity ?? 0.45,
        order_priority: form.order_priority,
        is_active: form.is_active,
        show_in_welcome: form.show_in_welcome,
        show_in_catalog: form.show_in_catalog,
      };
      if (form.image_preview === null && isEditing.value && form.image_url === null) {
        payload.image = null;
      }
    }

    if (isEditing.value) {
      await updateKioskPromotion(editingId.value, payload);
      message.success("Promoción actualizada con éxito");
    } else {
      await createKioskPromotion(payload);
      message.success("Promoción creada con éxito");
    }

    showModal.value = false;
    await loadPromotions();
  } catch (error) {
    message.error("Error al guardar la promoción");
  } finally {
    saving.value = false;
  }
};

const handleToggleActive = async (row) => {
  try {
    await toggleKioskPromotionActive(row.id);
    row.is_active = !row.is_active;
    message.success(row.is_active ? "Promoción activada" : "Promoción pausada");
  } catch {
    message.error("Error al cambiar estado");
  }
};

const handleDelete = (row) => {
  dialog.warning({
    title: "Eliminar Promoción",
    content: `¿Estás seguro de eliminar el anuncio "${row.title}" del autoservicio?`,
    positiveText: "Eliminar",
    negativeText: "Cancelar",
    onPositiveClick: async () => {
      try {
        await deleteKioskPromotion(row.id);
        message.success("Promoción eliminada");
        await loadPromotions();
      } catch {
        message.error("Error al eliminar");
      }
    },
  });
};

const columns = [
  {
    title: "Banner",
    key: "preview",
    width: 140,
    render(row) {
      const img = row.image || row.product_image || row.combo_image;
      if (img) {
        return h(
          "div",
          {
            style: {
              width: "120px",
              height: "44px",
              borderRadius: "8px",
              backgroundImage: `url(${img})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              position: "relative",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
            },
          },
          [
            h("div", {
              style: {
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundColor: `rgba(0,0,0,${row.overlay_opacity ?? 0.45})`,
              },
            }),
            h(
              "span",
              {
                style: {
                  position: "relative",
                  zIndex: 2,
                  color: "#fff",
                  fontSize: "11px",
                  fontWeight: "bold",
                  padding: "2px 6px",
                  textShadow: "0 1px 2px rgba(0,0,0,0.8)",
                  textAlign: "center",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                },
              },
              row.badge_text || "OFERTA"
            ),
          ]
        );
      }
      return h(
        "div",
        {
          style: {
            width: "120px",
            height: "44px",
            borderRadius: "8px",
            background: `linear-gradient(135deg, ${row.gradient_color_start || "#FF6B00"}, ${row.gradient_color_end || "#E11D48"})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: "11px",
            fontWeight: "bold",
            padding: "4px 8px",
            textAlign: "center",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          },
        },
        row.badge_text || "OFERTA"
      );
    },
  },
  {
    title: "Título / Subtítulo",
    key: "title",
    render(row) {
      return h("div", [
        h("div", { class: "fw-bold" }, row.title),
        row.subtitle ? h("div", { class: "text-muted fs-8" }, row.subtitle) : null,
      ]);
    },
  },
  {
    title: "Destino",
    key: "target",
    width: 160,
    render(row) {
      if (row.product_name) {
        return h(NTag, { type: "info", size: "small" }, { default: () => `Producto: ${row.product_name}` });
      }
      if (row.combo_name) {
        return h(NTag, { type: "warning", size: "small" }, { default: () => `Combo: ${row.combo_name}` });
      }
      return h(NTag, { type: "default", size: "small" }, { default: () => "Solo anuncio" });
    },
  },
  {
    title: "Precio Oferta",
    key: "price",
    width: 120,
    render(row) {
      if (row.promo_price) {
        return h("span", { class: "fw-bold text-danger" }, `S/ ${Number(row.promo_price).toFixed(2)}`);
      }
      return h("span", { class: "text-muted fs-8" }, "Precio regular");
    },
  },
  {
    title: "Ubicación",
    key: "placement",
    width: 130,
    render(row) {
      const tags = [];
      if (row.show_in_welcome) tags.push(h(NTag, { size: "tiny", type: "success" }, { default: () => "Bienvenida" }));
      if (row.show_in_catalog) tags.push(h(NTag, { size: "tiny", type: "info" }, { default: () => "Catálogo" }));
      return h("div", { class: "d-flex gap-1 flex-wrap" }, tags);
    },
  },
  {
    title: "Activo",
    key: "is_active",
    width: 90,
    render(row) {
      return h(NSwitch, {
        value: row.is_active,
        onUpdateValue: () => handleToggleActive(row),
      });
    },
  },
  {
    title: "Acciones",
    key: "actions",
    width: 130,
    render(row) {
      return h("div", { class: "d-flex gap-1" }, [
        h(
          NButton,
          {
            size: "tiny",
            secondary: true,
            type: "info",
            onClick: () => openEditModal(row),
          },
          { default: () => "Editar" }
        ),
        h(
          NButton,
          {
            size: "tiny",
            secondary: true,
            type: "error",
            onClick: () => handleDelete(row),
          },
          { default: () => "Eliminar" }
        ),
      ]);
    },
  },
];

onMounted(() => {
  loadPromotions();
  loadCatalogData();
});
</script>

<style scoped>
.preview-card {
  min-height: 130px;
  position: relative;
  overflow: hidden;
  color: #ffffff !important;
}

.preview-card h4,
.preview-card .preview-title {
  color: #ffffff !important;
  font-weight: 800 !important;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.65) !important;
}

.preview-card p,
.preview-card .preview-subtitle {
  color: rgba(255, 255, 255, 0.95) !important;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.55) !important;
}

.preview-card .preview-badge-pill {
  color: #ffffff !important;
  font-weight: 800 !important;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5) !important;
}

.preview-card .preview-price-badge {
  background-color: #ffffff !important;
  color: #1e293b !important;
  font-weight: 900 !important;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2) !important;
}

.preview-card .preview-old-price {
  color: rgba(255, 255, 255, 0.7) !important;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5) !important;
  text-decoration: line-through !important;
}

.preview-card .preview-cta-btn {
  background-color: rgba(255, 255, 255, 0.28) !important;
  border: 1.5px solid rgba(255, 255, 255, 0.6) !important;
  color: #ffffff !important;
  backdrop-filter: blur(4px) !important;
}

.preview-card .preview-cta-btn-solid {
  background-color: #ffffff !important;
  color: #1e293b !important;
  font-weight: 900 !important;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25) !important;
}

.fs-7 {
  font-size: 0.85rem;
}
.fs-8 {
  font-size: 0.75rem;
}
</style>
