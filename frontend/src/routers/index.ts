import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import DashboardPage from "../views/DashboardPage.vue"
import LoginPage from "../views/LoginPage.vue"
import AcceptPage from "../views/AcceptPage.vue"
import CreatePage from "../views/CreatePage.vue"
import AdminPage from "../views/AdminPage.vue"
import { useAuth } from '../stores/auth'

const router: RouteRecordRaw[] = [
    { path: "/", meta: { name: "Dashboard" }, component: DashboardPage },
    { path: "/login", meta: { name: "Login" }, component: LoginPage },
    { path: "/accept", meta: { name: "Accept" }, component: AcceptPage },
    { path: "/create", meta: { name: "Create" }, component: CreatePage },
    { path: "/admin", meta: { name: "Admin" }, component: AdminPage },
]

const routers = createRouter({
    history: createWebHistory(),
    routes: router
})

// routers.beforeEach((to, from) => {
//     const auth = useAuth()
//     if (!auth.isAutorizited && to.path !== "/login") {
//         return { path: "/login" }
//     }
// })

export default routers