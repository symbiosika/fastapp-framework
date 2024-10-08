<template>
  <div class="flex flex-col items-center justify-center min-h-screen">
    <img src="/favicon.png" alt="Logo" class="w-16 h-16 mb-6" />
    <h1 class="text-4xl font-bold text-gray-800 mb-4">FastApp Framework</h1>
    <p class="text-lg text-gray-600 mb-2">Einfaches Onboarding für Deine App</p>

    <div class="flex flex-wrap justify-center gap-4 mt-10">
      <MarketingButton
        v-for="feature in features"
        :key="feature.label"
        :icon="feature.icon"
        :label="feature.label"
        :link="feature.link"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { fetcher } from "@/devkit/services/fetch";
import { onMounted, ref } from "vue";
import MarketingButton from "./MarketingButton.vue";

const user = ref(<any>null);
const demoData = ref(<any>{});

const getSomeData = async () => {
  const data = await fetcher.get("/api/v1/user/me");
  user.value = data;
};

const features = [
  {
    icon: "fa-solid fa-pen",
    label: "Einfache Formulare",
    link: "/#/use-forms",
  },
  {
    icon: "fa-solid fa-code",
    label: "API Anfragen",
    link: "/#/simple-api",
  },
  {
    icon: "fa-solid fa-database",
    label: "Datenbank Nutzung",
    link: "/#/use-database",
  },
];

onMounted(async () => {
  await getSomeData();
});
</script>
