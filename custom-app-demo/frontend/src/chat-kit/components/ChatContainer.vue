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
            isLoading ? 'thinking-button' : 'bg-blue-500 hover:bg-blue-600',
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
const suggestions = ref<string[]>([
  "Wie mache ich eine Datenbankabfrage?",
  "Wie füge ich ein Produkt hinzu?",
  "Ich will Produkt 'ABC' anlegen",
]);

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
.thinking-button {
  position: relative;
  padding-left: 50px;
  font-size: 16px;
  cursor: pointer;
}

.thinking-button .dots {
  position: absolute;
  left: 10px;
  top: 50%;
  display: flex;
  gap: 5px;
  transform: translateY(-50%);
}

.thinking-button .dots span {
  width: 10px;
  height: 10px;
  background-color: #333;
  border-radius: 50%;
  animation: bounce 1.2s infinite ease-in-out both;
}

.thinking-button .dots span:nth-child(1) {
  animation-delay: -0.32s;
}

.thinking-button .dots span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%,
  80%,
  100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}
</style>
