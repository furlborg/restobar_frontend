<template>
  <n-card title="Mesas" :bordered="false" :segmented="{ content: 'hard' }">
    <n-card class="my-2" v-for="area in areas" :key="area.id" :title="`AREA ${area.id}`" embedded>
      <n-grid responsive="screen" cols="6 s:6 m:12 l:24 xl:24 2xl:24" :x-gap="12" :y-gap="12">
        <n-gi v-for="table in area.tables" :key="table.id" :span="3">
          <n-card :title="String(table.id)" size="small" footer-style="padding: 0px;">
            <template #header-extra>
              <n-button text size="small">
                <v-icon name="bi-three-dots-vertical" />
              </n-button>
            </template>
            <n-icon size="115">
              <v-icon name="gi-meal" fill="lightblue"></v-icon>
            </n-icon>
            <template #footer>
              <n-space justify="space-between" align="end">
                <n-button type="info">
                  <n-icon size="24">
                    <v-icon name="md-add-round"></v-icon>
                  </n-icon>
                </n-button>
                <n-button class="w-100" type="success" text>
                  <n-icon size="48">
                    <v-icon name="gi-money-stack"></v-icon>
                  </n-icon>
                </n-button>
                <n-button type="error">
                  <n-icon size="24">
                    <v-icon name="md-remove-round"></v-icon>
                  </n-icon>
                </n-button>
              </n-space>
            </template>
          </n-card>
        </n-gi>
      </n-grid>
    </n-card>
  </n-card>
</template>

<script>
import {defineComponent, ref, onMounted} from 'vue'
import {useMessage} from "naive-ui"
import {getTables} from "@/api/modules/tables"

export default defineComponent({
    name: "Tables",
    setup() {
      const message = useMessage()
      const areas = ref([])

      const loadTablesData = () => {
        getTables()
          .then(response => {
            areas.value = response.data
          }).catch(error => {
            console.error(error)
            message.error('Algo salió mal...')
          })
      }

      onMounted(() => {
        loadTablesData()
      })
        return {
          areas,
        }
    }
})
</script>

<style lang="scss" scoped>

</style>