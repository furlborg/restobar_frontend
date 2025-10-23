<template>
    <n-modal preset="card" title="Indicaciones" :show="show" :on-close="() => $emit('update:show')">
        <n-list>
            <n-list-item v-for="(indication, index) in indications" class="p-2" :class="{ 'bg-selected': selectedIndication === index }"
                         :key="index" @click="selectIndication(index)">
                <template #prefix>
                    <v-icon :name="!indication.takeAway ? 'io-bag' : 'io-bag-check'"
                            @click="indication.takeAway ? (indication.takeAway = false) : (indication.takeAway = true)"
                            :fill="!indication.takeAway ? null : 'green'" @click.stop/>
                </template>
                <n-thing :title="product.product_name" :title-extra="`S/. ${product.price}`"/>
                <n-collapse-transition :show="selectedIndication === index">
                    <n-tag v-for="(quick, index) in quickIndications" :key="index" class="mx-1" checkable @click.stop
                           :checked="indication.quick_indications.some((ind) => ind === quick)"
                           @update:checked="() => handleIndications(indication, quick)">
                        {{ quick }}
                    </n-tag>
                    <n-form>
                        <n-form-item v-if="selectedIndication !== null" :span="12" label="Indicaciones">
                            <n-input @click.stop type="textarea" v-model:value="indication.description"/>
                        </n-form-item>
                    </n-form>
                </n-collapse-transition>
            </n-list-item>
        </n-list>
        <template #action>
            <n-space justify="end">
                <n-button type="info" @click="saveIndications">Guardar</n-button>
            </n-space>
        </template>
    </n-modal>
</template>

<script>
import { defineComponent, ref, computed, toRefs, watch } from "vue";
import { cloneDeep } from "@/utils";
import { useGenericsStore } from "@/store/modules/generics";

export default defineComponent({
    name: "OrderIndications",
    emits: [ "update:show", "success" ],
    props: {
        show: {
            type: Boolean,
            default: false
        },
        product: {
            default: null
        }
    },
    setup(props, { emit }) {
        const { show, product } = toRefs(props);
        const genericsStore = useGenericsStore();
        const indications = ref([]);

        const quickIndications = computed(() => {
            console.log(product.value);
            if (product.value.quick_indications) {
                return product.value.quick_indications.trim().split(",");
            }
            return [];
        });

        const handleIndications = (indication, quick) => {
            const index = indication.quick_indications.findIndex((ind) => ind === quick);
            if (index >= 0) {
                indication.quick_indications.splice(index, 1);
            } else {
                indication.quick_indications.push(quick);
            }
        };

        watch(show, (val) => {
            if ( !val) return;

            const qty = Number(product.value.quantity) || 1;
            const current = cloneDeep(product.value.indication || []);

            indications.value = Array.from({ length: qty }, (_, i) => ({
                takeAway: current[i]?.takeAway || false,
                description: current[i]?.description || "",
                quick_indications: Array.isArray(current[i]?.quick_indications) ? current[i].quick_indications : []
            }));
        });

        const selectedIndication = ref(null);

        const selectIndication = (indication) => {
            if ( !selectedIndication.value) {
                selectedIndication.value = indication;
            } else {
                if (selectedIndication.value === indication) {
                    selectedIndication.value = null;
                } else {
                    selectedIndication.value = indication;
                }
            }
        };

        const saveIndications = () => {
            product.value.indication.splice(0, product.value.indication.length, ...cloneDeep(indications.value));
            console.log(product.value);
            emit("success");
        };

        return {
            genericsStore,
            indications,
            saveIndications,
            selectIndication,
            selectedIndication,
            quickIndications,
            handleIndications
        };
    }
});
</script>

<style lang="scss">
.bg-selected {
  background-color: AliceBlue;
}
</style>
