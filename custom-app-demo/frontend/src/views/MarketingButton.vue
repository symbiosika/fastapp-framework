<template>
  <a
    :href="link"
    class="flex items-center p-4 rounded-lg shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg"
    :class="[size === 'large' ? 'text-xl' : 'text-lg']"
  >
    <i :class="icon" class="mr-3"></i>
    <span class="font-semibold">{{ label }}</span>
  </a>
</template>

<script setup lang="ts">
defineProps<{
  icon: string;
  label: string;
  link: string;
  size?: "default" | "large";
}>();
</script>

<style scoped>
a {
  background: linear-gradient(135deg, #ffd700, #ffb6c1);
  position: relative;
  overflow: hidden;
  color: #1e1e3f; /* Dark blue-purple color for text */
}

a::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #ffb6c1, #ffd700);
  transition: left 0.3s ease-in-out;
  z-index: 1;
}

a:hover::before {
  left: 0;
}

a > * {
  position: relative;
  z-index: 2;
}
</style>
