<template>

</template>

<script>
import {defineComponent} from "vue"
import { useMessage } from 'naive-ui'

export default defineComponent({
  name: "MessageContent",
  setup() {
    window['$message'] = useMessage()
  }
})
</script>

<style scoped>

</style>