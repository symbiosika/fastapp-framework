<template>
  <Toast position="top-center" />
  <ConfirmDialog />

  <ThreeColAppLayout
    v-model:show-left-sidebar="showLeftSidebar"
    v-model:show-right-sidebar="showRightSidebar"
    :main-menu-items="mainMenuItems"
    avatar-initials="FA"
    header="FastApp DevKit"
  >
    <template #main>
      <RouterView />
    </template>
  </ThreeColAppLayout>
</template>

<script setup lang="ts">
import { ref } from "vue";
import Toast from "primevue/toast";
import ConfirmDialog from "primevue/confirmdialog";
import { useToast } from "primevue/usetoast";
import { emitter } from "./devkit/services/eventbus";
import ThreeColAppLayout from "./devkit/components/layout/ThreeColAppLayout.vue";

const toast = useToast();
emitter.on("show-toast", (data: any) => {
  toast.add({
    severity: data.severity ?? "info",
    summary: data.message,
    life: data.duration ?? 3000,
  });
});

const showLeftSidebar = ref(false);
const showRightSidebar = ref(false);
const mainMenuItems = ref([
  {
    name: "features",
    header: "Features",
    icon: "fa-solid fa-star",
    items: [
      {
        name: "Einfache Formulare",
        url: "/use-forms",
        baseUrl: "/use-forms",
      },
      {
        name: "API Anfragen",
        url: "/simple-api",
        baseUrl: "/simple-api",
      },
      {
        name: "Datenbank Nutzung",
        url: "/use-database",
        baseUrl: "/use-database",
      },
      {
        name: "Chat Integration",
        url: "/chat-demo",
        baseUrl: "/chat-demo",
      },
    ],
  },
]);
</script>

<style>
@import "tailwindcss/base";
@import "tailwindcss/components";
@import "tailwindcss/utilities";
</style>
