import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import {store} from './store'
import {naive} from './plugins/naive'
import axios from "axios"
import '@/style/bootstrap-utilities.min.css'
import 'vfonts/FiraSans.css'

createApp(App).use(router, axios).use(store).use(naive).mount('#app')
