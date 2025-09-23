import { createRouter, createWebHistory } from "vue-router"
import DashboardPage from "../views/DashboardPage.vue"
import login from "../views/LoginPage.vue"
const routes = [
    { path: "/", name: "home", component: DashboardPage },
    { path: "/login", name: "login", component: login },
]
const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router