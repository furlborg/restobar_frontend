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
import "@/style/mobile-responsive.css";
import "vfonts/Lato.css";
import VueCookies from "vue-cookies";
import { startUpdateDetector } from "@/version/updateDetector";
import { resolveUpdateOnBoot } from "@/version/applyUpdate";
import { installLoadRecovery } from "@/version/loadRecovery";
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

// Recuperación ante pantallas que no cargan (HU-FLZ-ACT-008). Va antes de montar para cubrir la primera ruta.
try {
  installLoadRecovery(router);
} catch (error) {
  console.warn("[flizzy] no se pudo instalar la recuperación de carga", error);
}

app.mount("#app");

// Señal de arranque para el aviso de respaldo de index.html (HU-FLZ-ACT-008).
window.__FLIZZY_BOOTED__ = true;
window.dispatchEvent(new Event("flizzy:booted"));

// Detector de versiones nuevas (HU-FLZ-ACT-004). Solo informa; nunca recarga.
// Un error aquí no debe impedir que Flizzy arranque.
try {
  startUpdateDetector();
  // Si esta carga viene de "Actualizar ahora", confirma qué versión arrancó (HU-FLZ-ACT-007).
  resolveUpdateOnBoot(router).catch((error) => {
    console.warn("[flizzy] no se pudo verificar la actualización", error);
  });
} catch (error) {
  console.warn("[flizzy] no se pudo iniciar el detector de versiones", error);
}
