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
import { chatWithAgent } from "./lib/ai/chat";
import {
  chatCompletion,
  generateEmbedding,
  generateImage,
  generateImageDescription,
  generateLongText,
  getAllAIModels,
  speechToText,
  textToSpeech,
} from "./lib/ai/standard";

export default {
  // prompt templates
  addPromptTemplate,
  updatePromptTemplate,
  deletePromptTemplate,
  getPlainPlaceholdersForPromptTemplate,
  updatePromptTemplatePlaceholder,
  deletePromptTemplatePlaceholder,
  getPlaceholdersForPromptTemplate,
  // chat
  chatWithAgent,
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
  getAllAIModels,
  generateEmbedding,
  generateImageDescription,
  chatCompletion,
  generateLongText,
  speechToText,
  textToSpeech,
  generateImage,
};
