// src/router/index.ts
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
// lazy-load views to reduce initial bundle size
const DashboardPage = () => import('../views/DashboardPage.vue');
const LoginPage = () => import('../views/LoginPage.vue');
const AcceptPage = () => import('../views/AcceptPage.vue');
const CreatePage = () => import('../views/CreatePage.vue');
const AdminPage = () => import('../views/AdminPage.vue');
import { useAuth } from '../stores/auth';
import { bootReady } from '../services/bootGate'; // <-- ждём, прежде чем что-то решать
import { boot } from '../services/boot';

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
  // If already authenticated and opening /login, redirect by role
  if (!requiresAuth && auth.users && isLogin) {
    const u: any = auth.users;
    const isAdmin = !!(
      u?.allowedTargets?.includes?.('admin') ||
      (u?.role?.name && String(u.role.name).toLowerCase() === 'admin')
    );
    return { path: isAdmin ? '/admin' : '/' };
  }

  // Restrict /admin for non-admin users
  if (to.path === '/admin' && auth.users) {
    const u: any = auth.users;
    const isAdmin = !!(
      u?.allowedTargets?.includes?.('admin') ||
      (u?.role?.name && String(u.role.name).toLowerCase() === 'admin')
    );
    if (!isAdmin) return { path: '/' };
    // Админ: не ждём, грузим данные в фоне
    void boot({ with: { me: false, users: true, items: true, trans: true } });
  }

  // Обычные защищённые страницы: не блокируем UI, но прогреваем данные в фоне
  if (requiresAuth && auth.users && to.path !== '/admin') {
    // запустим загрузку items+trans без ожидания
    void boot({ with: { me: false, users: false, items: true, trans: true } });
  }
  return true;
});

export default router;
