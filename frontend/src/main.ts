import router from './routers/index';
import { createApp } from 'vue';
import App from './App.vue';
import { createPinia } from 'pinia';

import { boot } from './services/boot';
const pinia = createPinia();

const app = createApp(App);
app.use(router);
app.use(pinia);

try {
  const { ok, errors } = await boot();
  if (!ok) console.error('Boot warnings:', errors);
} catch (e) {
  console.error('Boot failed:', e);
} finally {
  app.mount('#app');
  document.getElementById('boot-loader')?.remove();
}
