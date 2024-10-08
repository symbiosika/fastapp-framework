<template>
  <div class="chat-container flex flex-col h-full min-h-96">
    <div class="flex-1 overflow-y-auto p-4">
      <ChatTextItem
        v-for="(message, index) in messages"
        :key="index"
        :type="message.type"
        :message="message.content"
      />
    </div>
    <div class="p-4 border-t sticky bottom-0 bg-white">
      <form @submit.prevent="sendMessage" class="flex">
        <input
          v-model="newMessage"
          type="text"
          placeholder="Geben Sie Ihre Nachricht ein..."
          class="flex-1 p-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          :disabled="isLoading"
          :class="[
            'text-white px-4 py-2 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500 relative overflow-hidden',
            isLoading ? 'bg-blue-400' : 'bg-blue-500 hover:bg-blue-600',
          ]"
        >
          <span :class="{ 'opacity-0': isLoading }">Abschicken</span>
          <span
            v-if="isLoading"
            class="absolute inset-0 loading-animation"
          ></span>
        </button>
      </form>
      <!-- Suggestions -->
      <div v-if="showSuggestions" class="mt-4 flex flex-wrap gap-2">
        <button
          v-for="(suggestion, index) in suggestions"
          :key="index"
          @click="selectSuggestion(suggestion)"
          class="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg text-gray-800 font-medium transition-colors"
        >
          {{ suggestion }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import ChatTextItem from "./ChatTextItem.vue";
import { fetcher } from "@/devkit/services/fetch";

interface Message {
  type: "user" | "system";
  content: string;
}

type UiActionTextBlock = {
  type: "render_text";
  content: string;
};

type FunctionCallingResponseUiAction = UiActionTextBlock;

interface AIChatResponse {
  chatId: string;
  reply: string;
  uiResponse: FunctionCallingResponseUiAction;
}

const messages = ref<Message[]>([
  { type: "system", content: "Hi. Wie kann ich Dir heute behilflich sein?" },
]);

const newMessage = ref("");

const isLoading = ref(false);

const sendMessage = async () => {
  if (newMessage.value.trim()) {
    isLoading.value = true;
    messages.value.push({ type: "user", content: newMessage.value });
    await sendRequest(newMessage.value + "");
    newMessage.value = "";
    isLoading.value = false;
  }
};

const sendRequest = async (usersMessage: string) => {
  const aiResult = await fetcher.post<AIChatResponse>("/api/v1/ai/smart-chat", {
    usersMessage,
    chatId: chatId.value,
  });
  messages.value.push({ type: "system", content: aiResult.reply });
  if (aiResult.uiResponse) {
    messages.value.push({
      type: "system",
      content: aiResult.uiResponse.content,
    });
  }
};

const chatId = ref("");
const suggestions = ref<string[]>(["Wie mache ich eine Datenbankabfrage?"]);

const selectSuggestion = (suggestion: string) => {
  newMessage.value = suggestion;
  sendMessage();
};

const showSuggestions = computed(() => {
  return !messages.value.some((message) => message.type === "user");
});

onMounted(async () => {
  // generate a random chatId for the session
  chatId.value = Math.random().toString(36).substring(2, 15);
});
</script>

<style scoped>
.loading-animation {
  background-image: linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.15) 25%,
    transparent 25%,
    transparent 50%,
    rgba(255, 255, 255, 0.15) 50%,
    rgba(255, 255, 255, 0.15) 75%,
    transparent 75%,
    transparent 100%
  );
  background-size: 40px 40px;
  animation: loading 1s linear infinite;
}

@keyframes loading {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 40px 0;
  }
}
</style>
