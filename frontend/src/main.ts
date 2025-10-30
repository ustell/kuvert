import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from './routers';
import App from './App.vue';
import { boot } from './services/boot';
import { setBootReady } from './services/bootGate';
import { registerSW } from 'virtual:pwa-register';

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

// 1) Fast boot: only fetch current user to enable routing quickly
const fastBootPromise = (async () => {
  const { ok, errors } = await boot({ with: { me: true, users: false, items: false, trans: false } });
  if (!ok) console.warn('Fast boot warnings:', errors);
})();

// Router guards will wait for this (do not block on heavy data)
setBootReady(fastBootPromise);

// Mount immediately; let router guards wait on fastBootPromise
app.mount('#app');

// When fast boot (me) finishes, hide overlay and warm-up full data
fastBootPromise
  .then(() => {
    hideBootOverlay();
    // Register PWA service worker (autoUpdate is enabled in vite-plugin-pwa config)
    try {
      registerSW({ immediate: true });
    } catch {}
    // 2) Background warm-up: full bootstrap without blocking UI
    (async () => {
      const { ok, errors } = await boot();
      if (!ok) console.warn('Background boot warnings:', errors);
    })();
  })
  .catch(() => {
    // Even if fast boot failed, hide overlay to avoid blocking UI
    hideBootOverlay();
  });
