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
      style="max-width: 650px; width: 95vw;"
      content-style="max-height: 70vh; overflow-y: auto;"
      :mask-closable="false"
    >
      <n-form ref="formRef" :model="form" :rules="rules" label-placement="top">
        <n-grid :cols="2" :x-gap="16">
          <n-gi :span="2">
            <n-form-item label="Título del Anuncio" path="title">
              <n-input v-model:value="form.title" placeholder="Ej. ¡Super Combo Familiar!" />
            </n-form-item>
          </n-gi>

          <n-gi :span="2">
            <n-form-item label="Subtítulo / Descripción" path="subtitle">
              <n-input
                v-model:value="form.subtitle"
                placeholder="Ej. Pizza Grande + Bebida 1.5L + Papas Crujientes"
              />
            </n-form-item>
          </n-gi>

          <n-gi :span="1">
            <n-form-item label="Texto de Insignia (Badge)">
              <n-input v-model:value="form.badge_text" placeholder="Ej. 30% OFF, 2x1, POPULAR" />
            </n-form-item>
          </n-gi>

          <n-gi :span="1">
            <n-form-item label="Prioridad en Carrusel">
              <n-input-number v-model:value="form.order_priority" :min="0" :max="100" class="w-100" />
            </n-form-item>
          </n-gi>

          <n-gi :span="1">
            <n-form-item label="Vincular a">
              <n-select
                v-model:value="targetType"
                :options="targetTypeOptions"
                @update:value="handleTargetTypeChange"
              />
            </n-form-item>
          </n-gi>

          <n-gi :span="1" v-if="targetType === 'PRODUCT'">
            <n-form-item label="Producto Seleccionado">
              <n-select
                v-model:value="form.product"
                :options="productOptions"
                filterable
                placeholder="Selecciona un producto"
                @update:value="onProductSelected"
              />
            </n-form-item>
          </n-gi>

          <n-gi :span="1" v-if="targetType === 'COMBO'">
            <n-form-item label="Combo Seleccionado">
              <n-select
                v-model:value="form.combo"
                :options="comboOptions"
                filterable
                placeholder="Selecciona un combo"
                @update:value="onComboSelected"
              />
            </n-form-item>
          </n-gi>

          <n-gi :span="1" v-if="targetType === 'NONE'">
            <n-form-item label="Destino">
              <n-text depth="3" class="fs-7">Solo anuncio informativo sin enlace directo</n-text>
            </n-form-item>
          </n-gi>

          <n-gi :span="1">
            <n-form-item label="Precio Promocional (S/)">
              <n-input-number
                v-model:value="form.promo_price"
                :min="0"
                :precision="2"
                placeholder="Dejar vacío para precio regular"
                class="w-100"
              />
            </n-form-item>
          </n-gi>

          <n-gi :span="1">
            <n-form-item label="Color Inicial del Banner">
              <n-color-picker v-model:value="form.gradient_color_start" :modes="['hex']" />
            </n-form-item>
          </n-gi>

          <n-gi :span="1">
            <n-form-item label="Color Final del Banner">
              <n-color-picker v-model:value="form.gradient_color_end" :modes="['hex']" />
            </n-form-item>
          </n-gi>

          <n-gi :span="2">
            <n-space justify="space-between" align="center" class="p-2 border rounded">
              <n-checkbox v-model:checked="form.show_in_welcome">
                Mostrar en Bienvenida
              </n-checkbox>
              <n-checkbox v-model:checked="form.show_in_catalog">
                Mostrar en Catálogo
              </n-checkbox>
              <n-checkbox v-model:checked="form.is_active">
                Activo
              </n-checkbox>
            </n-space>
          </n-gi>

          <!-- Previsualización en vivo 1:1 -->
          <n-gi :span="2" class="mt-3">
            <n-text strong class="fs-7 mb-2 d-block">Vista Previa en Vivo (Estilo Quiosco):</n-text>
            <div
              class="preview-card p-3 text-white rounded-4 shadow-sm"
              :style="{
                background: `linear-gradient(135deg, ${form.gradient_color_start}, ${form.gradient_color_end})`
              }"
            >
              <div class="d-flex justify-content-between align-items-center">
                <div style="flex: 1;">
                  <span
                    v-if="form.badge_text"
                    class="badge bg-danger rounded-pill px-2 py-1 mb-2 fw-bold"
                  >
                    {{ form.badge_text }}
                  </span>
                  <h4 class="fw-bold m-0 text-white">{{ form.title || 'Título de Promoción' }}</h4>
                  <p class="small m-0 text-white-50">{{ form.subtitle || 'Subtítulo o combo especial' }}</p>
                  <div class="mt-2" v-if="form.promo_price">
                    <span class="badge bg-white text-dark fw-bold fs-6">
                      S/ {{ Number(form.promo_price).toFixed(2) }}
                    </span>
                  </div>
                </div>
                <div class="ms-3 text-center">
                  <v-icon name="io-fast-food" scale="3" class="text-white opacity-75" />
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
import { h, onMounted, ref, reactive } from "vue";
import { useRouter } from "vue-router";
import {
  NButton,
  NTag,
  NSwitch,
  useMessage,
  useDialog,
} from "naive-ui";
import {
  getKioskPromotions,
  createKioskPromotion,
  updateKioskPromotion,
  toggleKioskPromotionActive,
  deleteKioskPromotion,
  searchProducts,
  getCombos,
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

const promotions = ref([]);
const productOptions = ref([]);
const comboOptions = ref([]);
const targetType = ref("PRODUCT");

const targetTypeOptions = [
  { label: "Producto", value: "PRODUCT" },
  { label: "Combo", value: "COMBO" },
  { label: "Solo Anuncio (Informativo)", value: "NONE" },
];

const defaultForm = () => ({
  title: "",
  subtitle: "",
  badge_text: "OFERTA",
  product: null,
  combo: null,
  promo_price: null,
  gradient_color_start: "#FF6B00",
  gradient_color_end: "#E11D48",
  order_priority: 0,
  is_active: true,
  show_in_welcome: true,
  show_in_catalog: true,
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
    const [prodRes, comboRes] = await Promise.all([
      searchProducts({ is_disabled: false }),
      getCombos({ is_active: true }),
    ]);
    const prods = prodRes.data?.results || prodRes.data || [];
    productOptions.value = prods.map((p) => ({
      label: `${p.name} - S/ ${Number(p.prices || 0).toFixed(2)}`,
      value: p.id,
      price: p.prices,
    }));

    const combos = comboRes.data?.results || comboRes.data || [];
    comboOptions.value = combos.map((c) => ({
      label: `${c.name} - S/ ${Number(c.fixed_price || 0).toFixed(2)}`,
      value: c.id,
      price: c.fixed_price,
    }));
  } catch (_) {}
};

const openCreateModal = () => {
  isEditing.value = false;
  editingId.value = null;
  Object.assign(form, defaultForm());
  targetType.value = "PRODUCT";
  showModal.value = true;
};

const openEditModal = (row) => {
  isEditing.value = true;
  editingId.value = row.id;
  Object.assign(form, {
    title: row.title,
    subtitle: row.subtitle || "",
    badge_text: row.badge_text || "",
    product: row.product,
    combo: row.combo,
    promo_price: row.promo_price ? Number(row.promo_price) : null,
    gradient_color_start: row.gradient_color_start || "#FF6B00",
    gradient_color_end: row.gradient_color_end || "#E11D48",
    order_priority: row.order_priority || 0,
    is_active: row.is_active,
    show_in_welcome: row.show_in_welcome,
    show_in_catalog: row.show_in_catalog,
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
    const payload = {
      title: form.title,
      subtitle: form.subtitle,
      badge_text: form.badge_text,
      product: targetType.value === "PRODUCT" ? form.product : null,
      combo: targetType.value === "COMBO" ? form.combo : null,
      promo_price: form.promo_price || null,
      gradient_color_start: form.gradient_color_start,
      gradient_color_end: form.gradient_color_end,
      order_priority: form.order_priority,
      is_active: form.is_active,
      show_in_welcome: form.show_in_welcome,
      show_in_catalog: form.show_in_catalog,
    };

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
  min-height: 100px;
  position: relative;
  overflow: hidden;
}
.fs-7 {
  font-size: 0.85rem;
}
.fs-8 {
  font-size: 0.75rem;
}
</style>
