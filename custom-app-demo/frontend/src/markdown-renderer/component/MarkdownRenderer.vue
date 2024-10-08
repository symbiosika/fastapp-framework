<template>
  <div class="markdown-wrapper">
    <div v-html="renderedMarkdown" class="markdown-content"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { marked } from "marked";

const props = defineProps<{
  content: string;
}>();

const renderedMarkdown = ref("");

const renderMarkdown = async () => {
  renderedMarkdown.value = await marked(props.content);
};

onMounted(renderMarkdown);
watch(() => props.content, renderMarkdown);
</script>

<style>
.markdown-wrapper .markdown-content {
  text-align: left;
  max-width: 800px;
  margin: 0 auto;
}

.markdown-wrapper .markdown-content h1 {
  font-size: 2em;
  font-weight: bold;
  margin-top: 1em;
  margin-bottom: 0.5em;
}

.markdown-wrapper .markdown-content h2 {
  font-size: 1.5em;
  font-weight: bold;
  margin-top: 1em;
  margin-bottom: 0.5em;
}

.markdown-wrapper .markdown-content h3 {
  font-size: 1.2em;
  font-weight: bold;
  margin-top: 1em;
  margin-bottom: 0.5em;
}

.markdown-wrapper .markdown-content p {
  margin-bottom: 1em;
}

.markdown-wrapper .markdown-content ul,
.markdown-wrapper .markdown-content ol {
  margin-left: 2em;
  margin-bottom: 1em;
}

.markdown-wrapper .markdown-content code {
  background-color: #f0f0f0;
  padding: 0.2em 0.4em;
  border-radius: 3px;
}

.markdown-wrapper .markdown-content pre {
  background-color: #f0f0f0;
  padding: 1em;
  border-radius: 5px;
  overflow-x: auto;
  margin-bottom: 1em;
}
</style>
