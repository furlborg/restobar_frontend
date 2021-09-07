import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import {store} from './store'
import {naive} from './plugins/naive'
import axios from "axios"

createApp(App).use(router, axios).use(store).use(naive).mount('#app')
