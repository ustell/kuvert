import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from './routers';
import App from './App.vue';
import { boot } from './services/boot';
import { setBootReady } from './services/bootGate';

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(router);

// прячем прелоадер
function hideBootOverlay() {
  const el = document.getElementById('boot');
  if (!el) return;
  el.classList.add('is-hidden');
  const remove = () => el.remove();
  el.addEventListener('transitionend', remove, { once: true });
  window.setTimeout(remove, 800);
}

const bootPromise = (async () => {
  const { ok, errors } = await boot();
  if (!ok) console.warn('Boot warnings:', errors);
})();

setBootReady(bootPromise);

try {
  await bootPromise;
} finally {
  app.mount('#app');
  hideBootOverlay();
}
