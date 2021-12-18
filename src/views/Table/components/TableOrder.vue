<template>
  <div id="TableOrder">
    <n-page-header class="mb-2" @back="handleBack">
      <template #title>
        <n-space justify="space-between">
          <n-text class="fs-2">Mesa {{ table }}</n-text>
        </n-space>
      </template>
    </n-page-header>
    <n-card>
      <n-grid responsive="screen" cols="5 s:5 m:5 l:5 xl:5 2xl:5" :x-gap="12">
        <n-gi :span="3">
          <router-view />
        </n-gi>
        <n-gi span="2">
          <n-card class="h-100" title="Pedidos" :bordered="false" embedded>
            <template #header-extra>
              <n-switch size="small" /><n-text>Por consumo</n-text>
            </template>
            <n-table>
              <thead>
                <tr>
                  <th width="50%">Producto</th>
                  <th width="25%">Cantidad</th>
                  <th width="25%">SubTotal</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Product</td>
                  <td>
                    <n-input-number class="border-top-0" :value="1" />
                  </td>
                  <td>S/. 10.00</td>
                </tr>
                <tr>
                  <td>Product</td>
                  <td>
                    <n-input-number class="border-top-0" :value="3" />
                  </td>
                  <td>S/. 30.00</td>
                </tr>
                <tr>
                  <td>Product</td>
                  <td>
                    <n-input-number class="border-top-0" :value="2" />
                  </td>
                  <td class>S/. 20.00</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="2">
                    <router-link
                      class="text-decoration-none"
                      :to="{
                        name: 'TablePayment',
                        params: { table: $route.params.table },
                      }"
                    >
                      <n-button type="success" text block>
                        <v-icon class="me-2" name="gi-money-stack" scale="2" />
                        <span class="fs-4">Cobrar</span>
                      </n-button>
                    </router-link>
                  </td>
                  <!-- <td class="bg-white fs-6 fw-bold">TOTAL</td> -->
                  <td class="fs-6 fw-bold">S/. 50.00</td>
                </tr>
                <!-- <tr>
                    <td class="bg-white fs-6 fw-bold">ICBPER</td>
                    <td class="bg-white fs-6 fw-bold">S/. 0.00</td>
                </tr>
                <tr>
                    <td class="bg-white fs-6 fw-bold">IGV</td>
                    <td class="bg-white fs-6 fw-bold">S/. 9.00</td>
                </tr>
                <tr>
                    <td class="bg-white fs-6 fw-bold">TOTAL</td>
                    <td class="bg-white fs-6 fw-bold">S/. 50.00</td>
                </tr> -->
              </tfoot>
            </n-table>
          </n-card>
        </n-gi>
      </n-grid>
    </n-card>
  </div>
</template>

<script>
import { defineComponent, ref } from "vue";
import { useRoute } from "vue-router";
import { useRouter } from "vue-router";
import { renderIcon } from "@/utils";

export default defineComponent({
  name: "TableOrder",
  setup() {
    const route = useRoute();
    const router = useRouter();
    const table = route.params.table;
    const listType = ref("grid");

    const productOptions = [
      {
        label: "Editar",
        key: "edit",
        icon: renderIcon("ri-edit-fill"),
      },
      {
        label: "Eliminar",
        key: "delete",
        icon: renderIcon("ri-delete-bin-2-fill"),
      },
    ];

    const handleBack = () => {
      router.push({ name: "TableHome" });
    };

    return {
      table,
      handleBack,
      listType,
      productOptions,
    };
  },
});
</script>

<style lang="scss" scoped>
.slide-enter-active,
.slide-leave-active {
  transition: opacity 1s, transform 1s;
}

.slide-enter,
.slide-leave-to {
  opacity: 0;
  transform: translateX(-30%);
}
</style>