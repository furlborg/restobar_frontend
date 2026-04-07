import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { store } from "./store";
import { naive } from "./plugins/naive";
import { OhVueIcon } from "@/plugins/icon";
import {
  setupNumericOnlyGuards,
  numericOnlyDirective,
} from "@/plugins/numeric-only";
import "@/style/bootstrap-utilities";
import "@/style/naive-ui-overrides.css";
import "vfonts/Lato.css";
import VueCookies from "vue-cookies";
import { addIcons } from "oh-vue-icons";
import {
  MdCalculateRound,
  MdMonetizationonRound,
  MdSendRound,
} from "oh-vue-icons/icons";

const app = createApp(App);

app.use(store);
app.use(router);
app.use(naive);

// Configurar cookies
app.config.globalProperties.$cookies = VueCookies;
VueCookies.config("1d");

setupNumericOnlyGuards();

addIcons(MdMonetizationonRound, MdCalculateRound, MdSendRound);

app.component("v-icon", OhVueIcon);
app.directive("numeric-only", numericOnlyDirective);

app.mount("#app");
