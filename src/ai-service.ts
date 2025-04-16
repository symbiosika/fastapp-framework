/**
 * All exposed AI functions to use in the customer app
 */

import {
  addPromptTemplate,
  deletePromptTemplate,
  deletePromptTemplatePlaceholder,
  getPlaceholdersForPromptTemplate,
  getPlainPlaceholdersForPromptTemplate,
  updatePromptTemplate,
  updatePromptTemplatePlaceholder,
} from "./lib/ai/prompt-templates/crud";
import { parseDocument } from "./lib/ai/parsing";
import { extractKnowledgeFromExistingDbEntry } from "./lib/ai/knowledge/add-knowledge";
import { getKnowledgeEntries } from "./lib/ai/knowledge/get-knowledge";
import {
  addFineTuningData,
  deleteFineTuningData,
  getFineTuningEntries,
  getFineTuningEntryById,
  updateFineTuningData,
} from "./lib/ai/fine-tuning";

import {
  createKnowledgeText,
  getKnowledgeText,
  updateKnowledgeText,
  deleteKnowledgeText,
  getKnowledgeTextByTitle,
} from "./lib/ai/knowledge/knowledge-texts";
import {
  addPromptSnippet,
  getPromptSnippets,
  getPromptSnippetById,
  updatePromptSnippet,
  deletePromptSnippet,
  getPromptSnippetByNameAndCategory,
} from "./lib/ai/prompt-snippets";

import { addKnowledgeTextFromUrl } from "./lib/ai/knowledge-texts";

import {
  getFullSourceDocumentsForSimilaritySearch,
  getNearestEmbeddings,
} from "./lib/ai/knowledge/similarity-search";
import {
  chatCompletion,
  generateEmbedding,
  generateImageDescription,
} from "./lib/ai/ai-sdk";
import { textToSpeech } from "./lib/ai/ai-sdk/tts";
import { speechToText } from "./lib/ai/ai-sdk/stt";

import { chat } from "./lib/ai/interaction";
import { chatStore } from "./lib/ai/chat-store";
import { getAIEmbeddingModel, getAIModel } from "./lib/ai/ai-sdk/get-model";
import { executeToolCall } from "./lib/ai/interaction/tools";
import {
  addTool,
  addDynamicTool,
  removeTool,
  removeDynamicTool,
} from "./lib/ai/interaction/tools";
import { initTemplateMessage } from "./lib/ai/prompt-templates/init-message";

export default {
  // prompt templates
  addPromptTemplate,
  updatePromptTemplate,
  deletePromptTemplate,
  getPlainPlaceholdersForPromptTemplate,
  updatePromptTemplatePlaceholder,
  deletePromptTemplatePlaceholder,
  getPlaceholdersForPromptTemplate,
  // knowledge
  parseDocument,
  extractKnowledgeFromExistingDbEntry,
  getKnowledgeEntries,
  addKnowledgeTextFromUrl,
  getNearestEmbeddings,
  getFullSourceDocumentsForSimilaritySearch,
  // knowledge texts
  createKnowledgeText,
  getKnowledgeText,
  updateKnowledgeText,
  deleteKnowledgeText,
  getKnowledgeTextByTitle,
  // fine-tuning
  getFineTuningEntryById,
  getFineTuningEntries,
  addFineTuningData,
  updateFineTuningData,
  deleteFineTuningData,
  // prompt snippets
  addPromptSnippet,
  getPromptSnippets,
  getPromptSnippetById,
  updatePromptSnippet,
  deletePromptSnippet,
  getPromptSnippetByNameAndCategory,
  // ai standard functions
  generateEmbedding,
  generateImageDescription,
  speechToText,
  textToSpeech,
  // chat
  chat,
  chatCompletion,
  executeToolCall,
  addTool,
  addDynamicTool,
  removeTool,
  removeDynamicTool,
  getAIModel,
  getAIEmbeddingModel,
  initTemplateMessage,
  // chat store
  chatStore,
};
