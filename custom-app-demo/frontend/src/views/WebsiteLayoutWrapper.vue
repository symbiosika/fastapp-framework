<template>
  <div class="mt-3 flex flex-col items-center justify-center">
    <img src="/favicon.png" alt="Logo" class="w-16 h-16 mb-6" />
    <h1 class="text-4xl font-bold text-gray-800 mb-4">{{ title }}</h1>
  </div>
  <div class="w-2/3 mt-10 mb-10bg-white p-10 rounded-lg shadow-md m-auto">
    <p class="text-lg text-gray-600 mb-2 text-center">
      {{ description }}
    </p>

    <slot />
  </div>

  <div class="flex mt-4 mb-5 gap-5 justify-center">
    <MarketingButton
      icon="fas fa-arrow-up"
      label="To the Top"
      link="#"
      size="small"
      @click.prevent="goToTop"
    />
    <MarketingButton
      icon="fas fa-arrow-left"
      label="Back"
      link="#"
      size="small"
      @click.prevent="goBack"
    />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import MarketingButton from "./MarketingButton.vue";

defineProps<{
  title: string;
  description?: string;
}>();

const router = useRouter();

const goBack = () => {
  router.back();
};

const goToTop = () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
};
</script>
