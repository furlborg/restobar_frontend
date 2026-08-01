<template>
  <n-modal
    v-model:show="modalVisible"
    preset="card"
    title="Personalizar Combo"
    :style="{ width: '90%', maxWidth: '600px' }"
    :segmented="{ content: 'hard' }"
  >
    <n-spin :show="false">
      <n-space vertical size="large">
        <!-- Información del combo -->
        <n-card size="small" embedded>
          <n-space vertical size="small">
            <n-text strong class="fs-5">{{ combo?.name }}</n-text>
            <n-space size="small">
              <n-tag :type="combo?.pricing_mode === 'FIXED' ? 'success' : 'info'">
                {{ combo?.pricing_mode === 'FIXED' ? 'Precio Fijo' : 'Precio Variable' }}
              </n-tag>
              <n-tag type="warning">
                S/. {{ parseFloat(combo?.computed_price || combo?.fixed_price || 0).toFixed(2) }}
              </n-tag>
            </n-space>
          </n-space>
        </n-card>

        <!-- Productos incluidos -->
        <n-card title="Productos incluidos" size="small">
          <n-list>
            <n-list-item v-for="item in combo?.items" :key="item.id">
              <n-thing>
                <template #header>
                  <n-text>{{ item.name || item.product?.name || item.product_name || 'Producto' }}</n-text>
                </template>
                <template #description>
                  <n-space size="small">
                    <n-tag size="small" type="info">
                      Cant: {{ item.quantity }}
                    </n-tag>
                    <n-tag size="small" type="success">
                      S/. {{ parseFloat(item.product?.prices || item.product_price || 0).toFixed(2) }}
                    </n-tag>
                  </n-space>
                </template>
              </n-thing>
            </n-list-item>
          </n-list>
        </n-card>

        <!-- Adicionales (si existen) -->
        <n-card 
          v-if="combo?.extras && combo.extras.length > 0" 
          title="Seleccionar Adicionales" 
          size="small"
        >
          <n-space vertical>
            <n-alert type="info" :show-icon="false">
              Selecciona los extras que deseas agregar (sin costo adicional)
            </n-alert>
            <n-checkbox-group v-model:value="selectedExtras">
              <n-space vertical>
                <n-checkbox 
                  v-for="extra in combo.extras" 
                  :key="extra" 
                  :value="extra"
                  :label="extra"
                />
              </n-space>
            </n-checkbox-group>
          </n-space>
        </n-card>

        <!-- Indicaciones especiales -->
        <n-card title="Indicaciones Especiales" size="small">
          <n-input
            v-model:value="indication"
            type="textarea"
            placeholder="Ej: Sin picante, término medio, etc."
            :rows="3"
            maxlength="200"
            show-count
          />
        </n-card>
      </n-space>
    </n-spin>

    <template #action>
      <n-space justify="end">
        <n-button @click="handleCancel">Cancelar</n-button>
        <n-button type="success" @click="handleConfirm">
          <v-icon name="md-checkround" class="me-1" />
          Confirmar
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script>
import { defineComponent, ref, computed, watch } from "vue";

export default defineComponent({
  name: "ComboExtrasModal",
  props: {
    show: {
      type: Boolean,
      required: true,
    },
    combo: {
      type: Object,
      default: null,
    },
  },
  emits: ["update:show", "success"],
  setup(props, { emit }) {
    const selectedExtras = ref([]);
    const indication = ref("");

    const modalVisible = computed({
      get: () => props.show,
      set: (value) => emit("update:show", value),
    });

    const handleCancel = () => {
      modalVisible.value = false;
      resetForm();
    };

    const handleConfirm = () => {
      emit("success", {
        selected_extras: selectedExtras.value,
        indication: indication.value,
      });
      resetForm();
    };

    const resetForm = () => {
      selectedExtras.value = [];
      indication.value = "";
    };

    watch(
      () => props.show,
      (newValue) => {
        if (newValue && props.combo) {
          // Pre-cargar extras si ya fueron seleccionados
          selectedExtras.value = props.combo.selected_extras || [];
          indication.value = props.combo.indication || "";
        }
      }
    );

    return {
      modalVisible,
      selectedExtras,
      indication,
      handleCancel,
      handleConfirm,
    };
  },
});
</script>
