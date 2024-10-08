<template>
  <div
    :class="[
      'max-w-[70%] rounded-lg p-3 mb-2',
      type === 'user'
        ? 'ml-auto bg-blue-500 text-white'
        : 'mr-auto bg-gray-200 text-gray-800',
    ]"
  >
    {{ message }}
  </div>
</template>

<script setup lang="ts">
interface Props {
  type: "user" | "system";
  message: string;
}

defineProps<Props>();
</script>
