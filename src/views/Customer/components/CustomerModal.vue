<template>
  <n-modal class="w-75" preset="card" title="Nuevo Cliente" :mask-closable="false" :show="show" :on-close="() => $emit('update:show', !show)">
    <n-grid>
    </n-grid>
  </n-modal>
</template>

<script>
import {defineComponent} from "vue"

export default defineComponent({
  name: "CustomerModal",
  emits: [
    'update:show',
  ],
  props: {
    show : {
      type: Boolean,
      default: false,
    }
  },
  setup() {
    return {}
  }
})
</script>

<style lang="scss" scoped>

</style>