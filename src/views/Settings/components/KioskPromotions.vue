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
        <n-button secondary @click="openCategoriesModal">
          <template #icon><v-icon name="md-fastfood-twotone" /></template>
          Categorías del kiosko
        </n-button>
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
    <!-- Modal: categorías que se muestran en el kiosko -->
    <n-modal
      v-model:show="showCategoriesModal"
      preset="card"
      title="Categorías del kiosko"
      style="max-width: 560px; width: 95vw;"
      content-style="padding: 16px 20px;"
    >
      <n-text depth="3" class="fs-7">
        Elige qué categorías verá el cliente en el autoservicio. Las ocultas no aparecen en el kiosko, pero sus
        productos siguen en el sistema.
      </n-text>

      <div class="kc-toolbar">
        <n-input v-model:value="categorySearch" clearable placeholder="Buscar categoría..." />
        <n-tag round :type="visibleCategoriesCount ? 'success' : 'warning'">
          {{ visibleCategoriesCount }} de {{ kioskCategories.length }} visibles
        </n-tag>
      </div>
      <n-space class="kc-bulk">
        <n-button size="small" secondary :disabled="categoriesLoading" @click="setAllKioskCategories(true)">
          Mostrar {{ categorySearch ? "las filtradas" : "todas" }}
        </n-button>
        <n-button size="small" secondary :disabled="categoriesLoading" @click="setAllKioskCategories(false)">
          Ocultar {{ categorySearch ? "las filtradas" : "todas" }}
        </n-button>
      </n-space>

      <n-spin :show="categoriesLoading">
        <n-scrollbar style="max-height: 52vh;">
          <div v-if="filteredKioskCategories.length" class="kc-list">
            <label v-for="cat in filteredKioskCategories" :key="cat.id" class="kc-row">
              <span class="kc-row__name">{{ cat.description }}</span>
              <n-switch
                :value="cat.show_in_kiosk"
                :loading="savingCategoryIds.includes(cat.id)"
                @update:value="(value) => toggleKioskCategory(cat, value)"
              />
            </label>
          </div>
          <n-empty
            v-else-if="!categoriesLoading"
            :description="categorySearch ? 'Ninguna categoría coincide' : 'No hay categorías activas'"
            class="kc-empty"
          />
        </n-scrollbar>
      </n-spin>
      <n-text v-if="!categoriesLoading && kioskCategories.length && !visibleCategoriesCount" type="warning" class="fs-7">
        Con todas las categorías ocultas el kiosko no mostrará ningún producto.
      </n-text>
    </n-modal>

    <!-- Modal Form: Create / Edit -->
    <!-- Modal: crear / editar promoción de autoservicio -->
    <n-modal
      v-model:show="showModal"
      preset="card"
      :title="isEditing ? 'Editar promoción de autoservicio' : 'Nueva promoción de autoservicio'"
      style="max-width: 1140px; width: 95vw;"
      content-style="max-height: 84vh; overflow-y: auto; padding: 20px 24px;"
      :mask-closable="false"
    >
      <n-form ref="formRef" :model="form" :rules="rules" label-placement="top">
        <div class="kp-layout">

          <!-- Izquierda: formulario en 4 pasos, todos visibles -->
          <div class="kp-steps">

            <!-- Paso 1: qué se promociona -->
            <section class="kp-step">
              <header class="kp-step__head">
                <span class="kp-step__num">1</span>
                <div>
                  <h3 class="kp-step__title">¿Qué quieres promocionar?</h3>
                  <p class="kp-step__desc">Elige si el anuncio es de un producto, de un combo o solo un mensaje.</p>
                </div>
              </header>

              <n-radio-group v-model:value="targetType" @update:value="handleTargetTypeChange" class="kp-seg">
                <n-radio-button value="PRODUCT">
                  <span class="kp-seg__item"><v-icon name="md-fastfood-twotone" /> Producto</span>
                </n-radio-button>
                <n-radio-button value="COMBO">
                  <span class="kp-seg__item"><v-icon name="gi-hot-meal" /> Combo</span>
                </n-radio-button>
                <n-radio-button value="NONE">
                  <span class="kp-seg__item"><v-icon name="md-campaign-round" /> Solo anuncio</span>
                </n-radio-button>
              </n-radio-group>

              <p class="kp-hint" v-if="targetType === 'PRODUCT'">Se mostrará el precio del producto, o el precio promocional si lo defines.</p>
              <p class="kp-hint" v-else-if="targetType === 'COMBO'">Se mostrará el precio del combo, o el precio promocional si lo defines.</p>
              <p class="kp-hint" v-else>Es solo un mensaje: no vincula ningún producto y no muestra precio.</p>

              <div class="kp-grid kp-mt" v-if="targetType === 'PRODUCT'">
                <n-form-item label="Filtrar por categoría">
                  <n-select
                    v-model:value="selectedCategoryFilter"
                    :options="categoryOptions"
                    clearable
                    placeholder="Todas las categorías"
                  />
                </n-form-item>
                <n-form-item label="Producto" required>
                  <n-select
                    v-model:value="form.product"
                    :options="filteredProductOptions"
                    filterable
                    :filter="filterProductOption"
                    placeholder="Buscar producto..."
                    @update:value="onProductSelected"
                  />
                </n-form-item>
              </div>

              <n-form-item v-if="targetType === 'COMBO'" class="kp-mt" label="Combo" required>
                <n-select
                  v-model:value="form.combo"
                  :options="comboOptions"
                  filterable
                  :filter="filterComboOption"
                  placeholder="Selecciona el combo"
                  @update:value="onComboSelected"
                />
              </n-form-item>

              <div class="kp-grid kp-mt">
                <n-form-item label="Precio promocional (S/)">
                  <n-input-number
                    v-model:value="form.promo_price"
                    :min="0"
                    :precision="2"
                    placeholder="Vacío = precio normal"
                    class="w-100"
                  />
                </n-form-item>

                <div v-if="targetType !== 'NONE' && selectedOriginalPrice" class="kp-price-card">
                  <div class="kp-price-card__row">
                    <span>Precio normal</span>
                    <strong class="kp-strike">S/ {{ selectedOriginalPrice.toFixed(2) }}</strong>
                  </div>
                  <div v-if="calculatedDiscountPercent && calculatedDiscountPercent > 0" class="kp-price-card__row">
                    <span class="kp-save">Ahorro: {{ calculatedDiscountPercent }}%</span>
                    <n-button size="tiny" type="primary" secondary @click="applyCalculatedBadge">
                      Usar “{{ calculatedDiscountPercent }}% OFF” como insignia
                    </n-button>
                  </div>
                </div>
              </div>
              <p v-if="targetType === 'NONE'" class="kp-hint">En un “solo anuncio” el precio no se muestra en el kiosko.</p>
            </section>

            <!-- Paso 2: mensaje -->
            <section class="kp-step">
              <header class="kp-step__head">
                <span class="kp-step__num">2</span>
                <div>
                  <h3 class="kp-step__title">Mensaje del anuncio</h3>
                  <p class="kp-step__desc">Lo que lee el cliente en la pantalla del kiosko.</p>
                </div>
              </header>

              <n-form-item label="Título" path="title" required>
                <n-input
                  v-model:value="form.title"
                  placeholder="Ej. ¡Super combo familiar!"
                  size="large"
                  :maxlength="120"
                  show-count
                />
              </n-form-item>

              <n-form-item label="Subtítulo (opcional)">
                <n-input
                  v-model:value="form.subtitle"
                  placeholder="Ej. Pizza grande + bebida 1.5L + papas crujientes"
                  :maxlength="255"
                />
              </n-form-item>

              <n-form-item label="Insignia (opcional)">
                <div class="kp-badge-field">
                  <n-input v-model:value="form.badge_text" placeholder="Ej. 30% OFF, 2x1, NUEVO" :maxlength="50" />
                  <div class="kp-chips">
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
                </div>
              </n-form-item>
            </section>

            <!-- Paso 3: apariencia -->
            <section class="kp-step">
              <header class="kp-step__head">
                <span class="kp-step__num">3</span>
                <div>
                  <h3 class="kp-step__title">Apariencia</h3>
                  <p class="kp-step__desc">Elige el fondo del banner. La vista previa se actualiza al instante.</p>
                </div>
              </header>

              <n-radio-group v-model:value="colorMode" @update:value="onColorModeChange" class="kp-seg">
                <n-radio-button value="gradient">
                  <span class="kp-seg__item"><v-icon name="md-gradient-round" /> Degradado</span>
                </n-radio-button>
                <n-radio-button value="solid">
                  <span class="kp-seg__item"><v-icon name="md-formatpaint-round" /> Color sólido</span>
                </n-radio-button>
                <n-radio-button value="image">
                  <span class="kp-seg__item"><v-icon name="md-image-round" /> Imagen</span>
                </n-radio-button>
              </n-radio-group>

              <!-- Fondo con imagen -->
              <template v-if="colorMode === 'image'">
                <div class="kp-box kp-mt">
                  <div class="kp-box__head">
                    <strong>Imagen del banner</strong>
                    <span class="kp-muted">JPG, PNG o WEBP</span>
                  </div>

                  <!-- Si el producto o combo seleccionado ya tiene foto -->
                  <div v-if="selectedTargetImage" class="kp-linked-photo">
                    <img :src="selectedTargetImage" alt="Foto vinculada" class="kp-linked-photo__img" />
                    <div class="kp-linked-photo__text">
                      <strong>Foto del {{ targetType === 'PRODUCT' ? 'producto' : 'combo' }} vinculado</strong>
                      <span class="kp-muted">Ya está cargada en Flizzy</span>
                    </div>
                    <n-button size="small" type="primary" secondary @click="useSelectedTargetImage">
                      Usar esta foto
                    </n-button>
                  </div>

                  <div class="kp-actions">
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
                        {{ form.image_preview ? 'Cambiar imagen' : 'Subir imagen desde el equipo' }}
                      </n-button>
                    </n-upload>

                    <n-button
                      v-if="form.image_preview || form.image_file"
                      size="small"
                      quaternary
                      type="error"
                      @click="clearImage"
                    >
                      Quitar imagen
                    </n-button>
                  </div>

                  <p v-if="form.image_preview" class="kp-ok">✓ Imagen activa como fondo del banner</p>
                </div>

                <div class="kp-box kp-mt">
                  <div class="kp-box__head">
                    <strong><v-icon name="md-opacity-round" /> Oscurecer la imagen</strong>
                    <span class="kp-pill">{{ Math.round((form.overlay_opacity ?? 0.45) * 100) }}%</span>
                  </div>
                  <p class="kp-hint kp-hint--tight">Un poco de sombra ayuda a que el texto y el precio se lean bien sobre cualquier foto.</p>
                  <n-slider
                    v-model:value="form.overlay_opacity"
                    :min="0.10"
                    :max="0.85"
                    :step="0.05"
                    :marks="{ 0.20: 'Claro', 0.45: 'Recomendado', 0.75: 'Oscuro' }"
                  />
                </div>
              </template>

              <!-- Fondo con color o degradado -->
              <template v-else>
                <div class="kp-mt">
                  <div class="kp-label">Colores sugeridos</div>
                  <div class="kp-presets">
                    <button
                      v-for="p in colorPresets"
                      :key="p.name"
                      type="button"
                      class="kp-preset"
                      @click="applyColorPreset(p)"
                      :style="{ background: `linear-gradient(135deg, ${p.start}, ${p.end})` }"
                    >
                      {{ p.name }}
                    </button>
                  </div>
                </div>

                <div v-if="colorMode === 'gradient'" class="kp-grid kp-mt">
                  <n-form-item label="Color inicial (izquierda)">
                    <div class="kp-color">
                      <n-color-picker
                        v-model:value="form.gradient_color_start"
                        :show-alpha="false"
                        :modes="['hex']"
                        style="width: 100px;"
                      />
                      <n-input v-model:value="form.gradient_color_start" placeholder="#FF6B00" />
                    </div>
                  </n-form-item>
                  <n-form-item label="Color final (derecha)">
                    <div class="kp-color">
                      <n-color-picker
                        v-model:value="form.gradient_color_end"
                        :show-alpha="false"
                        :modes="['hex']"
                        style="width: 100px;"
                      />
                      <n-input v-model:value="form.gradient_color_end" placeholder="#E11D48" />
                    </div>
                  </n-form-item>
                </div>

                <n-form-item v-else class="kp-mt" label="Color de fondo">
                  <div class="kp-color kp-color--single">
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
              </template>
            </section>

            <!-- Paso 4: dónde y cuándo se muestra -->
            <section class="kp-step">
              <header class="kp-step__head">
                <span class="kp-step__num">4</span>
                <div>
                  <h3 class="kp-step__title">¿Dónde se muestra?</h3>
                  <p class="kp-step__desc">Activa o pausa la promoción y elige en qué pantallas aparece.</p>
                </div>
              </header>

              <div class="kp-switch-row">
                <div>
                  <div class="kp-switch-row__title">Promoción activa</div>
                  <div class="kp-muted">Si la pausas, deja de mostrarse en el kiosko.</div>
                </div>
                <n-switch v-model:value="form.is_active" />
              </div>
              <div class="kp-switch-row">
                <div>
                  <div class="kp-switch-row__title">Pantalla de bienvenida</div>
                  <div class="kp-muted">Carrusel grande que ve el cliente al llegar al kiosko.</div>
                </div>
                <n-switch v-model:value="form.show_in_welcome" />
              </div>
              <div class="kp-switch-row">
                <div>
                  <div class="kp-switch-row__title">Catálogo</div>
                  <div class="kp-muted">Banner en la pantalla donde se elige la comida.</div>
                </div>
                <n-switch v-model:value="form.show_in_catalog" />
              </div>
              <div class="kp-switch-row">
                <div>
                  <div class="kp-switch-row__title">Orden de aparición</div>
                  <div class="kp-muted">El 0 se muestra primero; los números mayores van después.</div>
                </div>
                <n-input-number v-model:value="form.order_priority" :min="0" :max="100" style="width: 120px;" />
              </div>
            </section>
          </div>

          <!-- Derecha: vista previa fija mientras se desplaza el formulario -->
          <aside class="kp-preview">
            <div class="kp-preview__head">
              <v-icon name="md-pointofsale-twotone" scale="1.2" />
              <div>
                <strong>Así se verá en el kiosko</strong>
                <span class="kp-muted">Vista previa en tiempo real</span>
              </div>
            </div>

            <div class="preview-card" :style="previewCardStyle">
              <!-- Sombreado cuando el fondo es una imagen -->
              <div
                v-if="effectivePreviewImage && colorMode === 'image'"
                class="preview-shade"
                :style="previewOverlayStyle"
              />
              <!-- Círculos decorativos cuando no hay imagen (igual que en el kiosko) -->
              <template v-else>
                <span class="preview-circle preview-circle--a" />
                <span class="preview-circle preview-circle--b" />
              </template>

              <div class="preview-content">
                <span v-if="form.badge_text" class="preview-badge">{{ form.badge_text }}</span>
                <h4 class="preview-title">{{ form.title || 'Título de la promoción' }}</h4>
                <p class="preview-subtitle">{{ form.subtitle || 'Subtítulo del anuncio' }}</p>
                <div v-if="form.promo_price && targetType !== 'NONE'" class="preview-price-row">
                  <span class="preview-price">S/ {{ Number(form.promo_price).toFixed(2) }}</span>
                  <span v-if="selectedOriginalPrice && selectedOriginalPrice > form.promo_price" class="preview-old-price">
                    S/ {{ selectedOriginalPrice.toFixed(2) }}
                  </span>
                </div>
              </div>
            </div>

            <dl class="kp-summary">
              <div class="kp-summary__row">
                <dt>Destino</dt>
                <dd class="kp-truncate">{{ selectedTargetName }}</dd>
              </div>
              <div class="kp-summary__row">
                <dt>Se muestra en</dt>
                <dd>
                  <span class="kp-tag" :class="{ 'kp-tag--on': form.show_in_welcome }">Bienvenida</span>
                  <span class="kp-tag" :class="{ 'kp-tag--on': form.show_in_catalog }">Catálogo</span>
                </dd>
              </div>
              <div class="kp-summary__row">
                <dt>Estado</dt>
                <dd :class="form.is_active ? 'kp-state kp-state--on' : 'kp-state kp-state--off'">
                  {{ form.is_active ? '● Activa' : '○ Pausada' }}
                </dd>
              </div>
            </dl>
          </aside>

        </div>
      </n-form>

      <template #action>
        <n-space justify="end" class="mt-2">
          <n-button @click="showModal = false">Cancelar</n-button>
          <n-button type="primary" :loading="saving" @click="handleSave">
            Guardar promoción
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
  setCategoryShowInKiosk,
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
    return prod ? prod.name : "Producto seleccionado";
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
    // Solo el nombre: la etiqueta del selector trae "[Categoría] ... - S/ precio".
    form.title = prod.name;
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

// ─── Categorías que muestra el kiosko ───────────────────────────────────────
const showCategoriesModal = ref(false);
const categoriesLoading = ref(false);
const kioskCategories = ref([]);
const categorySearch = ref("");
const savingCategoryIds = ref([]);

const normalizeText = (str) =>
  (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();

const filteredKioskCategories = computed(() => {
  const q = normalizeText(categorySearch.value);
  if (!q) return kioskCategories.value;
  return kioskCategories.value.filter((c) => normalizeText(c.description).includes(q));
});

const visibleCategoriesCount = computed(
  () => kioskCategories.value.filter((c) => c.show_in_kiosk).length
);

const openCategoriesModal = async () => {
  showCategoriesModal.value = true;
  categorySearch.value = "";
  categoriesLoading.value = true;
  try {
    const res = await getCategories();
    const list = res.data?.results || res.data || [];
    kioskCategories.value = list
      .filter((c) => !c.is_disabled)
      // Si el backend aún no devuelve el campo, se asume visible (valor por defecto).
      .map((c) => ({ ...c, show_in_kiosk: c.show_in_kiosk !== false }));
  } catch (error) {
    message.error("No se pudieron cargar las categorías");
  } finally {
    categoriesLoading.value = false;
  }
};

const toggleKioskCategory = async (category, value) => {
  const previous = category.show_in_kiosk;
  category.show_in_kiosk = value;
  savingCategoryIds.value.push(category.id);
  try {
    await setCategoryShowInKiosk(category, value);
  } catch (error) {
    category.show_in_kiosk = previous;
    message.error(`No se pudo actualizar "${category.description}"`);
  } finally {
    savingCategoryIds.value = savingCategoryIds.value.filter((id) => id !== category.id);
  }
};

// Aplica a las categorías que se están viendo (respeta el buscador).
const setAllKioskCategories = async (value) => {
  const pending = filteredKioskCategories.value.filter((c) => c.show_in_kiosk !== value);
  await Promise.all(pending.map((c) => toggleKioskCategory(c, value)));
};

onMounted(() => {
  loadPromotions();
  loadCatalogData();
});
</script>

<style scoped>
/* ===== Modal de promoción: formulario en pasos + vista previa ===== */
.kp-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 380px;
  gap: 24px;
  align-items: start;
}

.kp-steps {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.kp-step {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 18px 20px;
}

.kp-step__head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 14px;
}

.kp-step__num {
  flex: none;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: #0f172a;
  color: #ffffff;
  font-size: 14px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.kp-step__title {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  line-height: 1.3;
  color: #0f172a;
}

.kp-step__desc {
  margin: 2px 0 0;
  font-size: 13px;
  color: #64748b;
}

.kp-hint {
  margin: 8px 0 0;
  font-size: 12.5px;
  color: #64748b;
}

.kp-hint--tight {
  margin: 0 0 12px;
}

.kp-muted {
  font-size: 12.5px;
  color: #64748b;
}

.kp-label {
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 700;
  color: #334155;
}

.kp-mt {
  margin-top: 14px;
}

.kp-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}

/* Selector segmentado: tres opciones del mismo ancho */
.kp-seg {
  display: flex;
  width: 100%;
}
.kp-seg :deep(.n-radio-button) {
  flex: 1;
  text-align: center;
}
.kp-seg__item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-weight: 700;
}

/* Comparación de precio normal / ahorro */
.kp-price-card {
  align-self: end;
  margin-bottom: 24px;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
  color: #475569;
}
.kp-price-card__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.kp-strike {
  text-decoration: line-through;
  color: #0f172a;
}
.kp-save {
  font-weight: 800;
  color: #059669;
}

.kp-badge-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}
.kp-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

/* Cajas internas (imagen, sombreado) */
.kp-box {
  padding: 14px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
}
.kp-box__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
  font-size: 14px;
  color: #0f172a;
}
.kp-linked-photo {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding: 8px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #ffffff;
}
.kp-linked-photo__img {
  width: 46px;
  height: 46px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}
.kp-linked-photo__text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  font-size: 13px;
}
.kp-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}
.kp-ok {
  margin: 10px 0 0;
  font-size: 12.5px;
  font-weight: 700;
  color: #059669;
}
.kp-pill {
  padding: 2px 10px;
  border-radius: 999px;
  background: #0f172a;
  color: #ffffff;
  font-size: 12px;
  font-weight: 800;
}

/* Colores sugeridos */
.kp-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.kp-preset {
  border: 0;
  border-radius: 999px;
  padding: 6px 14px;
  color: #ffffff;
  font-size: 12px;
  font-weight: 800;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.18);
}
.kp-color {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}
.kp-color--single {
  max-width: 380px;
}

/* Filas con interruptor */
.kp-switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 0;
  border-top: 1px solid #f1f5f9;
}
.kp-switch-row:first-of-type {
  border-top: 0;
  padding-top: 0;
}
.kp-switch-row__title {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
}

/* ===== Vista previa ===== */
.kp-preview {
  position: sticky;
  top: 0;
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  background: #f8fafc;
}
.kp-preview__head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  color: #0f172a;
}
.kp-preview__head strong,
.kp-preview__head .kp-muted {
  display: block;
}

.preview-card {
  position: relative;
  min-height: 190px;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
  border-radius: 20px;
  color: #ffffff;
  box-shadow: 0 12px 28px -6px rgba(15, 23, 42, 0.25);
}
/* Pie oscuro para que el texto blanco se lea sobre cualquier color */
.preview-card::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0) 40%, rgba(0, 0, 0, 0.38) 100%);
  pointer-events: none;
}
.preview-shade {
  position: absolute;
  inset: 0;
  z-index: 1;
}
.preview-circle {
  position: absolute;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  pointer-events: none;
}
.preview-circle--a {
  top: -50px;
  right: -40px;
  width: 190px;
  height: 190px;
}
.preview-circle--b {
  bottom: -60px;
  right: 70px;
  width: 140px;
  height: 140px;
  background: rgba(255, 255, 255, 0.07);
}
.preview-content {
  position: relative;
  z-index: 2;
  width: 100%;
  padding: 18px;
}
.preview-badge {
  display: inline-block;
  margin-bottom: 8px;
  padding: 3px 10px;
  border-radius: 999px;
  background: #ffffff;
  color: #c2410c;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.6px;
  text-transform: uppercase;
}
.preview-title {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.3px;
  color: #ffffff;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.45);
}
.preview-subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.45);
}
.preview-price-row {
  display: flex;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 4px 10px;
  margin-top: 10px;
}
.preview-price {
  font-size: 24px;
  font-weight: 800;
  line-height: 1;
  color: #ffffff;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.45);
}
.preview-old-price {
  font-size: 13px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.85);
  text-decoration: line-through;
}

/* Resumen bajo la vista previa */
.kp-summary {
  margin: 12px 0 0;
  padding: 12px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
}
.kp-summary__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.kp-summary dt {
  font-weight: 600;
  color: #64748b;
}
.kp-summary dd {
  margin: 0;
  font-weight: 700;
  color: #0f172a;
  display: flex;
  gap: 6px;
}
.kp-truncate {
  max-width: 190px;
  display: block !important;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.kp-tag {
  padding: 1px 9px;
  border-radius: 999px;
  border: 1px solid #e2e8f0;
  background: #f1f5f9;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 700;
}
.kp-tag--on {
  border-color: #fed7aa;
  background: #fff7ed;
  color: #c2410c;
}
.kp-state--on {
  color: #059669 !important;
}
.kp-state--off {
  color: #b91c1c !important;
}

.fs-7 {
  font-size: 0.85rem;
}
.fs-8 {
  font-size: 0.75rem;
}

/* Pantallas angostas: la vista previa pasa arriba y todo en una columna */
@media (max-width: 960px) {
  .kp-layout {
    grid-template-columns: 1fr;
  }
  .kp-preview {
    position: static;
    order: -1;
  }
  .kp-grid {
    grid-template-columns: 1fr;
  }
  .kp-price-card {
    margin-bottom: 14px;
  }
}

/* Celulares: el selector segmentado no se corta (sin iconos y con menos relleno) */
@media (max-width: 560px) {
  .kp-seg :deep(.n-radio-button) {
    flex: 1 1 0;
    min-width: 0;
    padding: 0 4px;
  }
  .kp-seg__item {
    font-size: 12.5px;
    gap: 0;
  }
  .kp-seg__item :deep(svg) {
    display: none;
  }
  .kp-step {
    padding: 16px 14px;
  }
}

/* Categorías del kiosko */
.kc-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 14px 0 10px;
}
.kc-toolbar :deep(.n-input) {
  flex: 1;
}
.kc-bulk {
  margin-bottom: 10px;
}
.kc-list {
  display: flex;
  flex-direction: column;
}
.kc-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 44px;
  padding: 6px 4px;
  border-bottom: 1px solid rgba(128, 128, 128, 0.18);
  cursor: pointer;
}
.kc-row__name {
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.kc-empty {
  padding: 24px 0;
}
</style>
