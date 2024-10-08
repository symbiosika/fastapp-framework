<template>
  <Toast position="top-center" />
  <ConfirmDialog />
  <RouterView />
</template>

<script setup lang="ts">
import Toast from "primevue/toast";
import ConfirmDialog from "primevue/confirmdialog";
import { useToast } from "primevue/usetoast";
import { emitter } from "./devkit/services/eventbus";

const toast = useToast();
emitter.on("show-toast", (data: any) => {
  toast.add({
    severity: data.severity ?? "info",
    summary: data.message,
    life: data.duration ?? 3000,
  });
});
</script>

<style>
@import "tailwindcss/base";
@import "tailwindcss/components";
@import "tailwindcss/utilities";
</style>
