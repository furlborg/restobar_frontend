<template>
  <div id="Supplies">
      <n-card title="Kardex" :segmented="{content: 'hard'}">
        <template #header-extra>
          <n-button type="info" text @click="buttonText.changeButton()">{{buttonText.text}}</n-button>
        </template>
        <KardexList v-if="list==='general'" />
        <KardexBySupply v-if="list==='bySupply'" />
      </n-card>
  </div>
</template>

<script>
import { defineComponent, ref } from "vue"
import KardexBySupply from './components/KardexBySupply'
import KardexList from './components/KardexList'

export default defineComponent({
  name: 'Supplies',
  components: {
    KardexBySupply,
    KardexList,
  },
  setup() {
    const list = ref('bySupply')
    const buttonText = ref({
      text: 'Ver por insumo',
      changeButton: () => {
        if (buttonText.value.text==='Ver por insumo') {
          buttonText.value.text = 'Ver general'
          list.value = 'general'
        } else if (buttonText.value.text==='Ver general') {
          buttonText.value.text = 'Ver por insumo'
          list.value = 'bySupply'
        }
      }
    })

    return {
      list,
      buttonText,
    }
  }
})
</script>

<style>

</style>