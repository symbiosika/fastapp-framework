<template>
  <div class="flex flex-col items-center justify-center min-h-screen">
    <WebsiteLayoutWrapper
      title="Simple API Requests"
      description="Es ist einfach API Anfragen aus der App heraus zu machen. Es braucht
        keine API-Keys, Authentifizierung oder sonstiges. Das Framework setzt
        ein Session Cookie. Die App selbst muss keinerlei Authentifizierung
        beachten."
    >
      <p>Abfragen gegen die API erfolgen via fetch. Beispiel:</p>
      <pre
        class="mt-5 p-4 bg-gray-100 rounded-lg overflow-auto ext-left mb-5"
      >
        <br>const data = await fetcher.get("/api/v1/user/me");
      </pre>
      <pre
        class="mt-5 p-4 bg-gray-100 rounded-lg overflow-auto text-left mb-5"
      >
        <br>GET /api/v1/user/me
      </pre>
      <pre
        class="mt-5 p-4 bg-gray-100 rounded-lg overflow-auto text-left mb-5"
      >
        <br>{{ user }}
      </pre>
    </WebsiteLayoutWrapper>
  </div>
</template>

<script setup lang="ts">
import { fetcher } from "@/devkit/services/fetch";
import { onMounted, ref } from "vue";
import WebsiteLayoutWrapper from "@/views/WebsiteLayoutWrapper.vue";

const user = ref(<any>null);
const demoData = ref(<any>{});

const getSomeData = async () => {
  const data = await fetcher.get("/api/v1/user/me");
  user.value = data;
};

onMounted(async () => {
  await getSomeData();
});
</script>
