<template>
  <n-modal preset="card" :mask-closable="false" >
  </n-modal>
</template>

<script>
import {defineComponent} from "vue"

export default defineComponent({
  name: "CustomerModal",
  props: {
    title: {
      type: String,
      default: 'Nuevo Cliente',
    },
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