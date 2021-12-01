<template>
  <div id="BusinessSettings">
    <n-page-header class="mb-2" @back="handleBack">
      <template #title>
        <n-text class="fs-2">Configuración de Empresa</n-text>
      </template>
    </n-page-header>
    <n-grid
      responsive="screen"
      cols="12 s:12 m:12 l:12 xl:24 2xl:24"
      :x-gap="12"
      :y-gap="12"
    >
      <n-gi :span="12">
        <n-card
          title="Información de la empresa"
          :segmented="{ content: 'hard' }"
        >
          <n-form>
            <n-grid
              responsive="screen"
              cols="6 s:6 m:12 l:12 xl:18 2xl:18"
              :x-gap="12"
              :y-gap="12"
            >
              <n-form-item-gi :span="6" label="RUC">
                <n-input :maxlength="11" show-count />
              </n-form-item-gi>
              <n-form-item-gi :span="6" label="Nombre">
                <n-input />
              </n-form-item-gi>
              <n-form-item-gi :span="6" label="Nombre Comercial">
                <n-input />
              </n-form-item-gi>
              <n-form-item-gi :span="6" label="Dirección">
                <n-input />
              </n-form-item-gi>
              <n-form-item-gi :span="6" label="Representante legal">
                <n-input />
              </n-form-item-gi>
              <n-form-item-gi :span="6" label="Celular">
                <n-input />
              </n-form-item-gi>
              <n-form-item-gi :span="6" label="Email">
                <n-input />
              </n-form-item-gi>
              <n-form-item-gi :span="6" label="Sitio web">
                <n-input />
              </n-form-item-gi>
              <n-form-item-gi :span="6" label="URL CPE">
                <n-input />
              </n-form-item-gi>
            </n-grid>
          </n-form>
          <template #action>
            <n-space justify="end">
              <n-button type="warning">Guardar</n-button>
            </n-space>
          </template>
        </n-card>
      </n-gi>
      <n-gi :span="12">
        <n-card title="Sucursales" :segmented="{ content: 'hard' }">
          <template #header-extra>
            <n-button type="success">Agregar</n-button>
          </template>
          <n-collapse accordion>
            <n-collapse-item title="Sucursal 1">
              <n-form>
                <n-grid
                  responsive="screen"
                  cols="12 s:12 m:12 l:12 xl:24 2xl:24"
                  :x-gap="12"
                >
                  <n-form-item-gi :span="12" label="Descripción">
                    <n-input />
                  </n-form-item-gi>
                  <n-form-item-gi :span="6" label="Celular">
                    <n-input />
                  </n-form-item-gi>
                  <n-form-item-gi :span="6" label="Email">
                    <n-input />
                  </n-form-item-gi>
                  <n-form-item-gi :span="12" label="Dirección fiscal">
                    <n-input />
                  </n-form-item-gi>
                  <n-form-item-gi :span="12" label="Dirección comercial">
                    <n-input />
                  </n-form-item-gi>
                  <n-form-item-gi :span="12" label="Sitio web">
                    <n-input />
                  </n-form-item-gi>
                  <n-form-item-gi :span="12" label="Información adicional">
                    <n-input type="textarea" />
                  </n-form-item-gi>
                </n-grid>
                <n-space justify="end">
                  <n-button type="warning">Guardar</n-button>
                </n-space>
              </n-form>
              <n-card class="mt-2" :bordered="false" embedded>
                <n-space align="center">
                  <n-text class="fs-5">Series Documentos</n-text>
                  <n-button
                    class="text-decoration-underline"
                    type="info"
                    text
                    @click="
                      collapsed === false
                        ? (collapsed = true)
                        : (collapsed = false)
                    "
                    >{{collapsed === false ? 'Mostrar' : 'Ocultar'}}</n-button
                  >
                </n-space>
                <n-collapse-transition :show="collapsed">
                  <n-table class="mt-2" :bordered="false">
                    <thead>
                      <tr>
                        <th>Serie</th>
                        <th>Tipo de Documento</th>
                        <th>Sucursal</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>F001</td>
                        <td>FACTURA ELECTRÓNICA</td>
                        <td>Sucursal 1</td>
                        <td>
                          <n-button class="float-end" type="error" text>
                            <v-icon
                              name="md-disabledbydefault-round"
                              scale="1.25"
                            />
                          </n-button>
                        </td>
                      </tr>
                      <tr>
                        <td>B001</td>
                        <td>BOLETA DE VENTA ELECTRÓNICA</td>
                        <td>Sucursal 2</td>
                        <td>
                          <n-button class="float-end" type="error" text>
                            <v-icon
                              name="md-disabledbydefault-round"
                              scale="1.25"
                            />
                          </n-button>
                        </td>
                      </tr>
                      <tr>
                        <td>NC001</td>
                        <td>NOTA DE CRÉDITO</td>
                        <td>Sucursal 1</td>
                        <td>
                          <n-button class="float-end" type="error" text>
                            <v-icon
                              name="md-disabledbydefault-round"
                              scale="1.25"
                            />
                          </n-button>
                        </td>
                      </tr>
                      <tr>
                        <td>ND001</td>
                        <td>NOTA DE DÉBITO</td>
                        <td>Sucursal 2</td>
                        <td>
                          <n-button class="float-end" type="error" text>
                            <v-icon
                              name="md-disabledbydefault-round"
                              scale="1.25"
                            />
                          </n-button>
                        </td>
                      </tr>
                      <tr>
                        <td>NV001</td>
                        <td>NOTA DE VENTA</td>
                        <td>Sucursal 1</td>
                        <td>
                          <n-button class="float-end" type="error" text>
                            <v-icon
                              name="md-disabledbydefault-round"
                              scale="1.25"
                            />
                          </n-button>
                        </td>
                      </tr>
                    </tbody>
                  </n-table>
                  <n-form class="mt-2">
                    <n-grid
                      responsive="screen"
                      cols="6 s:6 m:12 l:12 xl:18 2xl:18"
                      :x-gap="12"
                    >
                      <n-form-item-gi label="Tipo Documento" :span="6">
                        <n-select :options="saleDocumentOptions" />
                      </n-form-item-gi>
                      <n-form-item-gi label="Serie" :span="6">
                        <n-input />
                      </n-form-item-gi>
                      <n-form-item-gi :span="6">
                        <n-button type="success" block>Crear serie</n-button>
                      </n-form-item-gi>
                    </n-grid>
                  </n-form>
                </n-collapse-transition>
              </n-card>
            </n-collapse-item>
            <n-collapse-item title="Sucursal 2">
              <n-form>
                <n-grid
                  responsive="screen"
                  cols="12 s:12 m:12 l:12 xl:24 2xl:24"
                  :x-gap="12"
                >
                  <n-form-item-gi :span="12" label="Descripción">
                    <n-input />
                  </n-form-item-gi>
                  <n-form-item-gi :span="6" label="Celular">
                    <n-input />
                  </n-form-item-gi>
                  <n-form-item-gi :span="6" label="Email">
                    <n-input />
                  </n-form-item-gi>
                  <n-form-item-gi :span="12" label="Dirección fiscal">
                    <n-input />
                  </n-form-item-gi>
                  <n-form-item-gi :span="12" label="Dirección comercial">
                    <n-input />
                  </n-form-item-gi>
                  <n-form-item-gi :span="12" label="Sitio web">
                    <n-input />
                  </n-form-item-gi>
                  <n-form-item-gi :span="12" label="Información adicional">
                    <n-input type="textarea" />
                  </n-form-item-gi>
                </n-grid>
                <n-space justify="end">
                  <n-button type="warning">Guardar</n-button>
                </n-space>
              </n-form>
              <n-card class="mt-2" :bordered="false" embedded>
                <n-space align="center">
                  <n-text class="fs-5">Series Documentos</n-text>
                  <n-button
                    class="text-decoration-underline"
                    type="info"
                    text
                    @click="
                      collapsed2 === false
                        ? (collapsed2 = true)
                        : (collapsed2 = false)
                    "
                    >{{collapsed2 === false ? 'Mostrar' : 'Ocultar'}}</n-button
                  >
                </n-space>
                <n-collapse-transition :show="collapsed2">
                  <n-table class="mt-2" :bordered="false">
                    <thead>
                      <tr>
                        <th>Serie</th>
                        <th>Tipo de Documento</th>
                        <th>Sucursal</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>F001</td>
                        <td>FACTURA ELECTRÓNICA</td>
                        <td>Sucursal 1</td>
                        <td>
                          <n-button class="float-end" type="error" text>
                            <v-icon
                              name="md-disabledbydefault-round"
                              scale="1.25"
                            />
                          </n-button>
                        </td>
                      </tr>
                      <tr>
                        <td>B001</td>
                        <td>BOLETA DE VENTA ELECTRÓNICA</td>
                        <td>Sucursal 2</td>
                        <td>
                          <n-button class="float-end" type="error" text>
                            <v-icon
                              name="md-disabledbydefault-round"
                              scale="1.25"
                            />
                          </n-button>
                        </td>
                      </tr>
                      <tr>
                        <td>NC001</td>
                        <td>NOTA DE CRÉDITO</td>
                        <td>Sucursal 1</td>
                        <td>
                          <n-button class="float-end" type="error" text>
                            <v-icon
                              name="md-disabledbydefault-round"
                              scale="1.25"
                            />
                          </n-button>
                        </td>
                      </tr>
                      <tr>
                        <td>ND001</td>
                        <td>NOTA DE DÉBITO</td>
                        <td>Sucursal 2</td>
                        <td>
                          <n-button class="float-end" type="error" text>
                            <v-icon
                              name="md-disabledbydefault-round"
                              scale="1.25"
                            />
                          </n-button>
                        </td>
                      </tr>
                      <tr>
                        <td>NV001</td>
                        <td>NOTA DE VENTA</td>
                        <td>Sucursal 1</td>
                        <td>
                          <n-button class="float-end" type="error" text>
                            <v-icon
                              name="md-disabledbydefault-round"
                              scale="1.25"
                            />
                          </n-button>
                        </td>
                      </tr>
                    </tbody>
                  </n-table>
                  <n-form class="mt-2">
                    <n-grid
                      responsive="screen"
                      cols="6 s:6 m:12 l:12 xl:18 2xl:18"
                      :x-gap="12"
                    >
                      <n-form-item-gi label="Tipo Documento" :span="6">
                        <n-select :options="saleDocumentOptions" />
                      </n-form-item-gi>
                      <n-form-item-gi label="Serie" :span="6">
                        <n-input />
                      </n-form-item-gi>
                      <n-form-item-gi :span="6">
                        <n-button type="success" block>Crear serie</n-button>
                      </n-form-item-gi>
                    </n-grid>
                  </n-form>
                </n-collapse-transition>
              </n-card>
            </n-collapse-item>
          </n-collapse>
        </n-card>
      </n-gi>
    </n-grid>
  </div>
</template>

<script>
import { defineComponent, ref } from "vue";
import { useRouter } from "vue-router";
import { saleDocumentOptions } from "@/utils/constants";

export default defineComponent({
  name: "BusinessSettings",
  setup() {
    const router = useRouter();
    const collapsed = ref(false);
    const collapsed2 = ref(false);

    const handleBack = () => {
      router.push({ name: "HomeSettings" });
    };

    return {
      handleBack,
      collapsed,
      collapsed2,
      saleDocumentOptions,
    };
  },
});
</script>

<style>
</style>