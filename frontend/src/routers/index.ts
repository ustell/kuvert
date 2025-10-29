// src/router/index.ts
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import DashboardPage from '../views/DashboardPage.vue';
import LoginPage from '../views/LoginPage.vue';
import AcceptPage from '../views/AcceptPage.vue';
import CreatePage from '../views/CreatePage.vue';
import AdminPage from '../views/AdminPage.vue';
import { useAuth } from '../stores/auth';
import { bootReady } from '../services/bootGate'; // <-- ждём, прежде чем что-то решать

const routes: RouteRecordRaw[] = [
  { path: '/', component: DashboardPage, meta: { name: 'Dashboard', auth: true } },
  { path: '/accept', component: AcceptPage, meta: { name: 'Accept', auth: true } },
  { path: '/create', component: CreatePage, meta: { name: 'Create', auth: true } },
  { path: '/admin', component: AdminPage, meta: { name: 'Admin', auth: true } },
  { path: '/login', component: LoginPage, meta: { name: 'Login', auth: false } },
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});

router.beforeEach(async (to) => {
  // 🔒 главный трюк: ПЕРЕД любой логикой ждём, пока boot завершится.
  await bootReady;

  const auth = useAuth();
  if (typeof to.meta?.name === 'string') document.title = to.meta.name as string;

  const isLogin = to.path === '/login';
  const requiresAuth = (to.meta.auth ?? true) && !isLogin;

  if (requiresAuth && !auth.users) {
    return { path: '/login', query: { redirect: to.fullPath } };
  }
  if (!requiresAuth && auth.users) {
    return { path: '/' };
  }
  return true;
});

export default router;
