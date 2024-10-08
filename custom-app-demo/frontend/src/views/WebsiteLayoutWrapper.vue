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
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  description?: string;
}>();
</script>
