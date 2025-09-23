import router from './routers/index' // убедись, что router экспортится default
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const app = createApp(App)

// создаём pinia здесь и только здесь
const pinia = createPinia()

app.use(pinia)    // сначала pinia
app.use(router)   // потом router
app.mount('#app')
