<template>
  <div class="h-100 mh-100" id="CHome">
    <teleport to="body">
      <n-button
        class="position-absolute end-0 right-0 rounded-0"
        style="height: 64px; z-index: 20"
        type="info"
        secondary
      >
        <v-icon
          name="hi-solid-refresh"
          scale="1.5"
          :animation="refreshing ? 'spin' : null"
        />
      </n-button>
    </teleport>
    <n-grid class="h-100 mh-100" responsive="screen" cols="3 xs:1 s:3">
      <n-gi>
        <n-card
          class="h-100 mh-100 pendient"
          title="Pendientes"
          :bordered="false"
        >
          <div class="h-100 mh-100 position-relative">
            <n-scrollbar class="position-absolute h-100 mh-100">
              <div class="h-100 mh-100">
                <TransitionGroup name="list">
                  <div
                    class="mb-2"
                    style="background-color: white"
                    v-for="(order, index) in pendients"
                    :key="order.id"
                  >
                    <div class="p-3">
                      <n-space justify="space-between">
                        <n-text type="info">{{ order.user }}</n-text>
                        <n-text type="info">{{ order.table }}</n-text>
                      </n-space>
                      <n-space class="mt-3" justify="space-between">
                        <n-text class="fs-6">{{ order.product }}</n-text>
                        <n-text class="fs-6" type="error">{{
                          order.quantity
                        }}</n-text>
                      </n-space>
                      <ul>
                        <li
                          v-for="(indication, index) in order.indication"
                          :key="index"
                        >
                          <n-text>{{ indication.description }}</n-text>
                        </li>
                      </ul>
                    </div>
                    <n-button
                      class="rounded-0"
                      type="info"
                      secondary
                      block
                      @click="performUpdateProductPreparation(order.id, 1)"
                    >
                      <v-icon name="md-arrowforward-round" />
                    </n-button>
                  </div>
                </TransitionGroup>
              </div>
            </n-scrollbar>
          </div>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card
          class="h-100 mh-100 preparing"
          title="Preparando"
          :bordered="false"
        >
          <div class="h-100 mh-100 position-relative">
            <n-scrollbar class="position-absolute h-100 mh-100">
              <div class="h-100 mh-100">
                <TransitionGroup name="list">
                  <div
                    class="mb-2"
                    style="background-color: white"
                    v-for="(order, index) in preparing"
                    :key="order.id"
                  >
                    <div class="p-3">
                      <n-space justify="space-between">
                        <n-text type="info">{{ order.user }}</n-text>
                        <n-text type="info">{{ order.table }}</n-text>
                      </n-space>
                      <n-space class="mt-3" justify="space-between">
                        <n-text class="fs-6">{{ order.product }}</n-text>
                        <n-text class="fs-6" type="error">{{
                          order.quantity
                        }}</n-text>
                      </n-space>
                      <ul>
                        <li
                          v-for="(indication, index) in order.indication"
                          :key="index"
                        >
                          <n-text>{{ indication.description }}</n-text>
                        </li>
                      </ul>
                    </div>
                    <n-button
                      class="w-100 rounded-0"
                      type="success"
                      secondary
                      @click="performUpdateProductPreparation(order.id, 2)"
                    >
                      <v-icon name="md-arrowforward-round" />
                    </n-button>
                    <!-- <n-button-group class="w-100">
                      <n-button
                        class="w-50 rounded-0"
                        type="warning"
                        secondary
                        @click="performUpdateProductPreparation(order.id, 0)"
                      >
                        <v-icon name="md-arrowback-round" />
                      </n-button>
                      <n-button
                        class="w-50 rounded-0"
                        type="success"
                        secondary
                        @click="performUpdateProductPreparation(order.id, 2)"
                      >
                        <v-icon name="md-arrowforward-round" />
                      </n-button>
                    </n-button-group> -->
                  </div>
                </TransitionGroup>
              </div>
            </n-scrollbar>
          </div>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card
          class="h-100 mh-100 finished"
          title="Despachados"
          :bordered="false"
        >
          <div class="h-100 mh-100 position-relative">
            <n-scrollbar class="position-absolute h-100 mh-100">
              <div class="h-100 mh-100">
                <TransitionGroup name="list">
                  <div
                    class="mb-2"
                    style="background-color: white"
                    v-for="(order, index) in finished"
                    :key="order.id"
                  >
                    <div class="p-3">
                      <n-space justify="space-between">
                        <n-text type="info">{{ order.user }}</n-text>
                        <n-text type="info">{{ order.table }}</n-text>
                      </n-space>
                      <n-space class="mt-3" justify="space-between">
                        <n-text class="fs-6">{{ order.product }}</n-text>
                        <n-text class="fs-6" type="error">{{
                          order.quantity
                        }}</n-text>
                      </n-space>
                      <ul>
                        <li
                          v-for="(indication, index) in order.indication"
                          :key="index"
                        >
                          <n-text>{{ indication.description }}</n-text>
                        </li>
                      </ul>
                    </div>
                    <n-button
                      class="rounded-0"
                      type="info"
                      secondary
                      block
                      @click="performUpdateProductPreparation(order.id, 3)"
                    >
                      <v-icon name="md-arrowforward-round" />
                    </n-button>
                  </div>
                </TransitionGroup>
              </div>
            </n-scrollbar>
          </div>
        </n-card>
      </n-gi>
    </n-grid>
  </div>
</template>

<script>
import { ref, onMounted, defineComponent } from "vue";
import {
  listProductPreparation,
  updateProductPreparation,
} from "@/api/modules/orders";

export default defineComponent({
  name: "CHome",
  setup() {
    const pendients = ref([]);
    const preparing = ref([]);
    const finished = ref([]);

    const loadProductPreparation = async () => {
      await listProductPreparation()
        .then((response) => {
          if (response.status === 200) {
            pendients.value = response.data.filter((prep) => prep.status === 0);
            preparing.value = response.data.filter((prep) => prep.status === 1);
            finished.value = response.data.filter((prep) => prep.status === 2);
          }
        })
        .catch((error) => {
          console.error(error.response);
        });
    };

    const performUpdateProductPreparation = async (id, status) => {
      await updateProductPreparation(id, status)
        .then(async (response) => {
          if (response.status === 200) {
            await loadProductPreparation();
          }
        })
        .catch((error) => {
          console.error(error);
        });
    };

    const refreshing = ref(false);

    const refresh = async () => {
      refreshing.value = true;
      await loadProductPreparation();
      refreshing.value = false;
    };

    onMounted(() => {
      loadProductPreparation();
      setInterval(refresh, 5000);
    });

    return {
      refreshing,
      pendients,
      preparing,
      finished,
      loadProductPreparation,
      performUpdateProductPreparation,
    };
  },
});
</script>

<style scoped lang="scss">
.pendient {
  background-color: Ivory;
}
.preparing {
  background-color: AliceBlue;
}
.finished {
  background-color: HoneyDew;
}

/* GroupTransition */
.list-enter-active,
.list-leave-active {
  transition: all 0.25s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>