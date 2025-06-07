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
import {
  addBaseTool,
  addEntryToToolMemory,
  addRuntimeTool,
  removeBaseTool,
  removeRuntimeTool,
} from "./lib/ai/interaction/tools";
import { initTemplateMessage } from "./lib/ai/prompt-templates/init-message";
import { syncModels } from "./lib/ai/models/sync";
import { generateImages } from "./lib/ai/ai-sdk/image";
import {
  createAvatar,
  getAvatarByName,
  getAvatar,
  listAvatars,
  updateAvatar,
  deleteAvatar,
  getAvatarForChat,
} from "./lib/ai/avatars";
import { generateChatSummary } from "./lib/ai/chat-summary";

type AIService = {
  addPromptTemplate: typeof addPromptTemplate;
  updatePromptTemplate: typeof updatePromptTemplate;
  deletePromptTemplate: typeof deletePromptTemplate;
  getPlainPlaceholdersForPromptTemplate: typeof getPlainPlaceholdersForPromptTemplate;
  updatePromptTemplatePlaceholder: typeof updatePromptTemplatePlaceholder;
  deletePromptTemplatePlaceholder: typeof deletePromptTemplatePlaceholder;
  getPlaceholdersForPromptTemplate: typeof getPlaceholdersForPromptTemplate;
  parseDocument: typeof parseDocument;
  extractKnowledgeFromExistingDbEntry: typeof extractKnowledgeFromExistingDbEntry;
  getKnowledgeEntries: typeof getKnowledgeEntries;
  addKnowledgeTextFromUrl: typeof addKnowledgeTextFromUrl;
  getNearestEmbeddings: typeof getNearestEmbeddings;
  getFullSourceDocumentsForSimilaritySearch: typeof getFullSourceDocumentsForSimilaritySearch;
  createKnowledgeText: typeof createKnowledgeText;
  getKnowledgeText: typeof getKnowledgeText;
  updateKnowledgeText: typeof updateKnowledgeText;
  deleteKnowledgeText: typeof deleteKnowledgeText;
  getKnowledgeTextByTitle: typeof getKnowledgeTextByTitle;
  getFineTuningEntryById: typeof getFineTuningEntryById;
  getFineTuningEntries: typeof getFineTuningEntries;
  addFineTuningData: typeof addFineTuningData;
  updateFineTuningData: typeof updateFineTuningData;
  deleteFineTuningData: typeof deleteFineTuningData;
  addPromptSnippet: typeof addPromptSnippet;
  getPromptSnippets: typeof getPromptSnippets;
  getPromptSnippetById: typeof getPromptSnippetById;
  updatePromptSnippet: typeof updatePromptSnippet;
  deletePromptSnippet: typeof deletePromptSnippet;
  getPromptSnippetByNameAndCategory: typeof getPromptSnippetByNameAndCategory;
  generateEmbedding: typeof generateEmbedding;
  generateImageDescription: typeof generateImageDescription;
  speechToText: typeof speechToText;
  textToSpeech: typeof textToSpeech;
  chat: typeof chat;
  chatCompletion: typeof chatCompletion;
  addBaseTool: typeof addBaseTool;
  addRuntimeTool: typeof addRuntimeTool;
  removeBaseTool: typeof removeBaseTool;
  removeRuntimeTool: typeof removeRuntimeTool;
  addEntryToToolMemory: typeof addEntryToToolMemory;
  getAIModel: typeof getAIModel;
  getAIEmbeddingModel: typeof getAIEmbeddingModel;
  initTemplateMessage: typeof initTemplateMessage;
  generateImages: typeof generateImages;
  syncModels: typeof syncModels;
  chatStore: typeof chatStore;
  createAvatar: typeof createAvatar;
  getAvatarByName: typeof getAvatarByName;
  getAvatar: typeof getAvatar;
  listAvatars: typeof listAvatars;
  updateAvatar: typeof updateAvatar;
  deleteAvatar: typeof deleteAvatar;
  getAvatarForChat: typeof getAvatarForChat;
  generateChatSummary: typeof generateChatSummary;
};

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
  addBaseTool,
  addRuntimeTool,
  removeBaseTool,
  removeRuntimeTool,
  addEntryToToolMemory,
  getAIModel,
  getAIEmbeddingModel,
  initTemplateMessage,
  // images
  generateImages,
  // models
  syncModels,
  // chat store
  chatStore,
  // avatars
  createAvatar,
  getAvatarByName,
  getAvatar,
  listAvatars,
  updateAvatar,
  deleteAvatar,
  getAvatarForChat,
  // chat summary
  generateChatSummary,
} as AIService;
