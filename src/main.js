import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import {store} from './store'
import {naive} from './plugins/naive'
import {OhVueIcon} from "@/plugins/icon"
import '@/style/bootstrap-utilities.min.css'
import 'vfonts/FiraSans.css'

createApp(App).use(router).use(store).use(naive).component("v-icon", OhVueIcon).mount('#app')
