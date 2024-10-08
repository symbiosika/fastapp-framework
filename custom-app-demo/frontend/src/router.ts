import { createWebHashHistory, createRouter } from "vue-router";
const routes = [
  {
    path: "/",
    name: "home",
    component: () => import("./views/Start.vue"),
  },
  {
    path: "/use-forms",
    name: "use-forms",
    component: () => import("./views/UseForms.vue"),
  },
  {
    path: "/simple-api",
    name: "simple-api",
    component: () => import("./views/SimpleApi.vue"),
  },
  {
    path: "/use-database",
    name: "use-database",
    component: () => import("./views/UseDatabase.vue"),
  },
  {
    path: "/chat-demo",
    name: "chat-demo",
    component: () => import("./views/ChatDemo.vue"),
  },
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export const goto = (data: { name?: string; url?: string }) => {
  if (data.name) {
    router.push({ name: data.name });
  } else {
    router.push({ path: data.url });
  }
};

export const actualUrl = (): string => {
  return router.currentRoute.value.fullPath;
};

export const actualRoute = (): string => {
  return router.currentRoute.value.name?.toString() ?? "";
};
