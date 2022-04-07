<template>
  <n-modal
    :class="{
      'w-100': genericsStore.device === 'mobile',
      'w-75': genericsStore.device === 'tablet',
      'w-50': genericsStore.device === 'desktop',
    }"
    preset="card"
    :title="modalTitle"
    :mask-closable="false"
    :show="show"
    :on-close="() => $emit('update:show')"
  >
    <n-spin :show="isLoadingData">
      <n-form :rules="formRules" :model="customer" ref="customerRef">
        <n-tabs type="line">
          <n-tab-pane name="info" tab="Información General">
            <n-grid
              responsive="screen"
              cols="6 s:6 m:12 l:24 xl:24 2xl:24"
              :x-gap="12"
            >
              <n-form-item-gi
                label="Nombres"
                path="names"
                :span="12"
                @keypress="isLetter($event)"
                ref="customer_name"
              >
                <n-input v-model:value="customer.names" placeholder="" />
              </n-form-item-gi>
              <n-form-item-gi label="Tipo Documento" path="doc_type" :span="5">
                <n-select
                  v-model:value="customer.doc_type"
                  :options="documentOptions"
                  placeholder=""
                  @update:value="changeDocMax"
                />
              </n-form-item-gi>
              <n-form-item-gi
                label="Nº Documento"
                :required="formRules.doc_num.required"
                path="doc_num"
                :span="7"
              >
                <n-input-group>
                  <n-input
                    v-model:value="customer.doc_num"
                    :maxlength="docMaxLength"
                    placeholder=""
                    show-count
                    @keypress="isNumber($event)"
                  />
                  <n-popover
                    placement="top-end"
                    trigger="hover"
                    :delay="750"
                    :duration="500"
                  >
                    <template #trigger>
                      <n-button
                        type="info"
                        :disabled="
                          !(
                            customer.doc_num.length === 8 ||
                            customer.doc_num.length === 11
                          ) || isSearchingDoc
                        "
                        :loading="isSearchingDoc"
                        secondary
                        @click="performSearchByDoc"
                      >
                        <n-icon>
                          <v-icon name="md-personsearch-round" />
                        </n-icon>
                      </n-button>
                    </template>
                    <span>Consultar DNI/RUC</span>
                  </n-popover>
                </n-input-group>
              </n-form-item-gi>
              <n-form-item-gi label="Correo" :span="12">
                <n-input v-model:value="customer.email" placeholder="" />
              </n-form-item-gi>
              <n-form-item-gi
                label="Fecha de Nacimiento"
                path="birthdate"
                :span="4"
              >
                <n-date-picker
                  v-model:formatted-value="customer.birthdate"
                  type="date"
                  placeholder=""
                  clearable
                ></n-date-picker>
              </n-form-item-gi>
              <n-form-item-gi label="Teléfono" :span="4">
                <n-input
                  v-model:value="customer.phone"
                  :maxlength="12"
                  placeholder=""
                  @keypress="isNumber($event)"
                />
              </n-form-item-gi>
              <n-form-item-gi label="Género" path="gender" :span="4">
                <n-radio-group
                  v-model:value="customer.gender"
                  name="genderGroup"
                >
                  <n-radio-button key="gender" value="F">F</n-radio-button>
                  <n-radio-button key="gender" value="M">M</n-radio-button>
                </n-radio-group>
              </n-form-item-gi>
            </n-grid>
          </n-tab-pane>
          <n-tab-pane name="addresses" tab="Direcciones">
            <n-h3>Registro de direcciones</n-h3>
            <n-grid
              responsive="screen"
              cols="6 s:6 m:12 l:24 xl:24 2xl:24"
              :x-gap="12"
            >
              <template
                v-for="(address, index) in customer.addresses"
                :key="index"
              >
                <n-form-item-gi label="Dirección" :span="24">
                  <n-input-group>
                    <n-select
                      style="width: 200px"
                      :options="countriesOptions"
                      default-value="PE"
                      disabled
                    ></n-select>
                    <n-cascader
                      separator=" ⏵ "
                      :options="ubigeeOptions"
                      v-model:value="address.ubigeo"
                      check-strategy="child"
                    />
                    <n-input
                      v-model:value="address.description"
                      placeholder=""
                    />
                    <n-popconfirm v-if="index > 0">
                      <template #trigger>
                        <n-button type="error" secondary>
                          <v-icon name="md-deletesweep-round" />
                        </n-button>
                      </template>
                      ¿Está seguro?
                      <template #action>
                        <n-button
                          type="error"
                          size="small"
                          @click="
                            address.id
                              ? (address.is_disabled = true)
                              : popAddress(index)
                          "
                        >
                          Sí
                        </n-button>
                      </template>
                    </n-popconfirm>
                  </n-input-group>
                </n-form-item-gi>
              </template>
            </n-grid>
            <n-button class="w-100" type="info" dashed @click="addAddress"
              >Agregar dirección</n-button
            >
          </n-tab-pane>
        </n-tabs>
      </n-form>
    </n-spin>
    <template #action>
      <n-space justify="end">
        <n-button
          v-if="idCustomer === 0"
          type="primary"
          :loading="isLoadingData"
          :disabled="isLoadingData"
          @click="performCreate"
          secondary
          >Registrar</n-button
        >
        <n-button
          v-else
          type="warning"
          :loading="isLoadingData"
          :disabled="isLoadingData"
          @click="performUpdate"
          secondary
          >Modificar</n-button
        >
      </n-space>
    </template>
  </n-modal>
</template>

<script>
import { defineComponent, ref, toRefs, watch, computed } from "vue";
import format from "date-fns/format";
import { isNumber, isLetter } from "@/utils";
import { toTimestamp } from "@/utils/dates";
import { documentOptions, customerRules } from "@/utils/constants";
import {
  retrieveCustomer,
  createCustomer,
  updateCustomer,
  requestCustomerData,
} from "@/api/modules/customer";
import { useMessage } from "naive-ui";
import { useCustomerStore } from "@/store/modules/customer";
import { useGenericsStore } from "@/store/modules/generics";

export default defineComponent({
  name: "CustomerModal",
  emits: ["update:show", "on-success"],
  props: {
    show: {
      type: Boolean,
      default: false,
    },
    idCustomer: {
      type: Number,
      default: 0,
    },
  },
  setup(props, { emit }) {
    const message = useMessage();
    const requestMessage = ref(null);
    const customerStore = useCustomerStore();
    const genericsStore = useGenericsStore();
    const { idCustomer, show } = toRefs(props);
    const modalTitle = ref("Registrar Cliente");
    const isLoadingData = ref(false);
    const isSearchingDoc = ref(false);
    const customerRef = ref(null);
    const customer = ref({
      names: null,
      doc_type: "0",
      doc_num: "",
      email: null,
      phone: null,
      birthdate: null,
      gender: null,
      addresses: [
        {
          description: "",
          ubigeo: null,
          is_disabled: false,
        },
      ],
    });
    const docMaxLength = ref(20);
    const countriesOptions = computed(() => customerStore.countries);
    const ubigeeOptions = computed(() => {
      return customerStore.ubigee;
    });

    const formRules = computed(() => {
      let rules = customerRules;
      if (customer.value.doc_type === "0") {
        rules.doc_num.required = false;
      } else {
        rules.doc_num.required = true;
      }
      return rules;
    });

    watch(show, async () => {
      if (show.value === true && idCustomer.value !== 0) {
        document.title = "Modificar Cliente | App";
        modalTitle.value = "Modificar Cliente";
        isLoadingData.value = true;
        await retrieveCustomer(idCustomer.value)
          .then((response) => {
            customer.value = response.data;
          })
          .catch((error) => {
            console.error(error);
            message.error("Algo salió mal...");
          })
          .finally(() => {
            isLoadingData.value = false;
          });
      } else if (show.value === true && idCustomer.value === 0) {
        document.title = "Registrar Cliente | App";
        modalTitle.value = "Registrar Cliente";
        customer.value = {
          names: null,
          doc_type: "0",
          doc_num: "",
          email: null,
          phone: null,
          birthdate: null,
          gender: null,
          addresses: [
            {
              description: "",
              ubigeo: null,
              is_disabled: false,
            },
          ],
        };
      }
    });

    const customer_name = ref(null);

    const errorLabel = (field) => {
      switch (field) {
        case "names":
          return "Nombres";
        case "doc_type":
          return "Tipo Documento";
        case "doc_num":
          return "N° Documento";
        case "birthdate":
          return "Fecha de Nacimiento";
        case "email":
          return "Correo";
        case "phone":
          return "Teléfono";
        case "gender":
          return "Género";
        default:
          return null;
      }
    };

    const performCreate = (e) => {
      e.preventDefault();
      customerRef.value.validate(async (errors) => {
        if (!errors) {
          isLoadingData.value = true;
          customer.value.addresses.forEach((address) =>
            address.description.toUpperCase()
          );
          await createCustomer(customer.value)
            .then((response) => {
              if (response.status === 201) {
                message.success("Cliente registrado!");
                emit("on-success", response.data);
              }
            })
            .catch((error) => {
              for (const value in error.response.data) {
                message.error(
                  `${errorLabel(value)}: ${error.response.data[`${value}`][0]}`
                );
              }
              /* message.error("Algo salió mal..."); */
            })
            .finally(() => {
              isLoadingData.value = false;
            });
        } else {
          console.error(errors);
          message.error("Datos incorrectos");
        }
      });
    };

    const performUpdate = (e) => {
      e.preventDefault();
      customerRef.value.validate(async (errors) => {
        if (!errors) {
          isLoadingData.value = true;
          customer.value.addresses.forEach((address) =>
            address.description.toUpperCase()
          );
          await updateCustomer(idCustomer.value, customer.value)
            .then((response) => {
              if (response.status === 202) {
                message.success("Cliente actualizado!");
                emit("on-success", response.data);
              }
            })
            .catch((error) => {
              console.error(error);
              message.error("Algo salió mal...");
            })
            .finally(() => {
              isLoadingData.value = false;
            });
        } else {
          console.error(errors);
          message.error("Datos incorrectos");
        }
      });
    };

    const performSearchByDoc = async () => {
      if (customer.value.doc_num) {
        if (
          customer.value.doc_num.length === 8 ||
          customer.value.doc_num.length === 11
        ) {
          requestMessage.value = message.loading("Consultando documento...", {
            duration: 0,
          });
          isSearchingDoc.value = true;
          await requestCustomerData(customer.value.doc_num)
            .then((response) => {
              if (response.status === 200) {
                message.success("Éxito");
                if (customer.value.doc_num.length === 8) {
                  customer.value.names = response.data.nombre_completo;
                  customer.value.birthdate = format(
                    new Date(response.data.fecha_nacimiento),
                    "dd/MM/yyyy"
                  );
                  if (response.data.sexo === "FEMENINO") {
                    customer.value.gender = "F";
                  } else if (response.data.sexo === "MASCULINO") {
                    customer.value.gender = "M";
                  }
                } else if (customer.value.doc_num.length === 11) {
                  customer.value.names = response.data.nombre_o_razon_social;
                  customer.value.addresses[0].ubigeo = response.data.ubigeo[2];
                  customer.value.addresses[0].description =
                    response.data.direccion;
                }
                customer_name.value.restoreValidation();
              } else if (response.status === 404) {
                message.error("Documento no encontrado");
              } else {
                message.error("Algo salió mal...");
              }
            })
            .catch((error) => {
              console.error(error);
              message.error("Algo salió mal...");
            })
            .finally(() => {
              requestMessage.value.destroy();
              isSearchingDoc.value = false;
            });
        } else {
          message.error("Documento inválido");
        }
      } else {
        message.error("Documento inválido");
      }
    };

    const addAddress = () => {
      customer.value.addresses.push({
        description: "",
        ubigeo: null,
        is_disabled: false,
      });
    };
    const popAddress = (address) => {
      customer.value.addresses.splice(address, 1);
    };

    const changeDocMax = () => {
      switch (customer.value.doc_type) {
        case "0":
          docMaxLength.value = 20;
          break;
        case "1":
          docMaxLength.value = 8;
          break;
        case "4":
          docMaxLength.value = 12;
          break;
        case "6":
          docMaxLength.value = 11;
          break;
        case "7":
          docMaxLength.value = 12;
          break;
        default:
          console.error("Error: Tipo de Documento inválido");
          break;
      }
    };

    return {
      genericsStore,
      isLoadingData,
      isSearchingDoc,
      isNumber,
      isLetter,
      modalTitle,
      customer,
      customerRef,
      formRules,
      documentOptions,
      countriesOptions,
      ubigeeOptions,
      customer_name,
      addAddress,
      popAddress,
      performCreate,
      performUpdate,
      performSearchByDoc,
      changeDocMax,
      docMaxLength,
    };
  },
});
</script>

<style lang="scss" scoped>
</style>