import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { store } from "./store";
import { naive } from "./plugins/naive";
import { OhVueIcon } from "@/plugins/icon";
import "@/style/bootstrap-utilities";
import "@/style/naive-ui-overrides.css";
import "vfonts/Lato.css";
import VueCookies from "vue-cookies";

const app = createApp(App);

app.use(store);
app.use(router);
app.use(naive);
app.use(VueCookies, { expireTimes: "1d" });
app.component("v-icon", OhVueIcon);
app.mount("#app");
