import { createApp } from "vue";
import App from "./App.vue";
import router from "@/router";
import { store } from "@/store";
import VueNativeSock from "vue-native-websocket-vue3";
import { naive } from "@/plugins/naive";
import { OhVueIcon } from "@/plugins/icon";
import "@/style/bootstrap-utilities.min.css";
import "vfonts/Lato.css";
import { useSocketStoreWithOut } from "./store/socket";

const socketStore = useSocketStoreWithOut();

const app = createApp(App);
app
  .use(store)
  .use(router)
  .use(VueNativeSock, "ws://192.168.1.101:7000/ws/orders/", {
    store: socketStore,
    format: "json",
    connectManually: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 3000,
  })
  .use(naive)
  .component("v-icon", OhVueIcon)
  .mount("#app");
export default app;
