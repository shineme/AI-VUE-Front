import { createApp } from 'vue'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import './style.css'
import './assets/styles/main.css'
import App from './App.vue'

const app = createApp(App)
app.use(Antd)
app.mount('#app')