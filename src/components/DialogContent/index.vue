<template>

</template>

<script>
import {defineComponent} from "vue"
import { useDialog } from 'naive-ui'

export default defineComponent({
  name: "DialogContent",
  setup() {
    window['$dialog'] = useDialog()
  }
})
</script>

<style scoped>

</style>