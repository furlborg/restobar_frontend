<template>
  <n-card title="Clientes" :bordered="false" :segmented="{ content: 'hard' }">
    <template #header-extra>
      <n-button type="primary" @click="">
        <template #icon>
          <n-icon>
            <v-icon name="la-user-plus-solid" />
          </n-icon>
        </template>
        Nuevo
      </n-button>
    </template>
    <n-collapse arrow-placement="right">
    </n-collapse>
  </n-card>
</template>

<script>
import {defineComponent} from "vue"
import {OhVueIcon} from "@/plugins/icon"

export default defineComponent({
  name: "Customer",
  components: {
    'v-icon': OhVueIcon
  },
  setup() {
    return {}
  }
})
</script>

<style scoped>

</style>