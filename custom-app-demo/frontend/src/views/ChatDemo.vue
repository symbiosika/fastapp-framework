<template>
  <div class="flex flex-col items-center justify-center min-h-screen">
    <WebsiteLayoutWrapper
      title="DevKit - Chat-Kit"
      description="Not only a Chat-Bot. Benutzerdefinierte Elemente im Chat nutzen und interaktiv mit dem Chat arbeiten."
    >
      <ChatContainer />
    </WebsiteLayoutWrapper>
  </div>
</template>

<script setup lang="ts">
import ChatContainer from "@/chat-kit/components/ChatContainer.vue";
import WebsiteLayoutWrapper from "@/views/WebsiteLayoutWrapper.vue";
</script>
