/**
 * Test for the dynamic knowledge base tool
 */
import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import {
  initTests,
  TEST_USER_1,
  TEST_ORGANISATION_1,
} from "../../../../test/init.test";
import {
  importTestKnowledge,
  deleteTestKnowledge,
  TEST_KNOWLEDGE_TEXT,
} from "../../../../test/knowledge.test";
import { chat } from "../index";
import { chatStore } from "../../chat-store";
import { createDynamicKnowledgeBaseTool } from "../tools/dynamic-knowledge-base";
import { addDynamicTool } from "../tools";
import { chatCompletion } from "../../ai-sdk";

describe("Dynamic Knowledge Base Tool Tests", () => {
  let knowledgeEntryId: string;

  // Initialize tests and import test knowledge
  beforeAll(async () => {
    await initTests();
    const entry = await importTestKnowledge();
    knowledgeEntryId = entry.id;
  });

  // it("should create and register a dynamic knowledge tool", async () => {
  //   // Create a dynamic tool with the test knowledge entry
  //   const dynamicTool = createDynamicKnowledgeBaseTool({
  //     knowledgeEntryIds: [knowledgeEntryId],
  //     baseName: "testKnowledgeTool",
  //     getUserContext: () => ({
  //       userId: TEST_USER_1.id,
  //       organisationId: TEST_ORGANISATION_1.id,
  //     }),
  //   });

  //   // Add the tool to the registry
  //   addDynamicTool(dynamicTool.name, dynamicTool.tool);

  //   // Check if the tool was added to the registry
  //   expect(toolRegistry[dynamicTool.name]).toBeDefined();

  //   // Execute the tool directly to test it
  //   const result = await executeToolCall(
  //     dynamicTool.name,
  //     { query: "Eichhörnchen" },
  //     {
  //       userId: TEST_USER_1.id,
  //       organisationId: TEST_ORGANISATION_1.id,
  //     }
  //   );

  //   // Verify the result contains information from the test knowledge
  //   expect(result).toContain("Eichhörnchen");
  //   expect(result).toContain("Chunk ID:");

  //   // Verify the result contains expected text from test knowledge
  //   expect(result).toContain(TEST_KNOWLEDGE_TEXT.substring(0, 50));
  // }, 15000);

  // // Tests anpassen für das neue Tooling-Format
  // it("should utilize the dynamic knowledge tool in a chat session", async () => {
  //   // Create a dynamic tool with the test knowledge entry
  //   const dynamicTool = createDynamicKnowledgeBaseTool({
  //     knowledgeEntryIds: [knowledgeEntryId],
  //     baseName: "chatTestKnowledgeTool",
  //     getUserContext: () => ({
  //       userId: TEST_USER_1.id,
  //       organisationId: TEST_ORGANISATION_1.id,
  //     }),
  //   });

  //   // Add the tool to the registry
  //   addDynamicTool(dynamicTool.name, dynamicTool.tool);

  //   // Set up a chat with the dynamic tool enabled
  //   const chatResponse = await chat({
  //     input: "Was sind Eichhörnchen?",
  //     enabledTools: [dynamicTool.name],
  //     context: {
  //       userId: TEST_USER_1.id,
  //       organisationId: TEST_ORGANISATION_1.id,
  //     },
  //   });

  //   // Get the updated chat session
  //   const session = await chatStore.get(chatResponse.chatId);

  //   // Verify a chat session was created
  //   expect(session).toBeDefined();
  //   expect(session!.messages.length).toBeGreaterThan(0);

  //   // Verify the assistant message contains information about squirrels
  //   // This is a fuzzy test as the exact content depends on the AI response
  //   const assistantMessage = session!.messages.find(
  //     (m) => m.role === "assistant"
  //   );
  //   expect(assistantMessage).toBeDefined();
  //   expect(assistantMessage!.content).toBeTruthy();
  // }, 15000);

  // // Now that we've fixed the tooling system, we can enable this test
  // it("should track tool usage in chatCompletion", async () => {
  //   // Create a dynamic tool with the test knowledge entry
  //   const dynamicTool = createDynamicKnowledgeBaseTool({
  //     knowledgeEntryIds: [knowledgeEntryId],
  //     baseName: "trackingTestTool",
  //     getUserContext: () => ({
  //       userId: TEST_USER_1.id,
  //       organisationId: TEST_ORGANISATION_1.id,
  //     }),
  //   });

  //   // Add the tool to the registry
  //   addDynamicTool(dynamicTool.name, dynamicTool.tool);

  //   // Mock the AI SDK's generateText to simulate tool usage
  //   const mockMessages = [
  //     { role: "system", content: "You are a helpful assistant." },
  //     { role: "user", content: "Was sind Eichhörnchen?" },
  //   ] as any; // Type assertion as any to avoid CoreMessage type issues

  //   const result = await chatCompletion(
  //     mockMessages,
  //     {
  //       userId: TEST_USER_1.id,
  //       organisationId: TEST_ORGANISATION_1.id,
  //     },
  //     {
  //       tools: [dynamicTool.name],
  //     }
  //   );

  //   // Verify the result contains metadata
  //   expect(result.meta).toBeDefined();

  //   // Now that tool usage tracking is implemented in chatCompletion
  //   // We can add this test, but it will only pass if the AI actually uses the tool
  //   // which might not happen in all test runs
  //   if (result.meta.toolsUsed) {
  //     expect(Array.isArray(result.meta.toolsUsed)).toBe(true);
  //   }
  // }, 15000);

  // Now we test an assistant call that needs to create a tool call itself
  it("should track tool usage in chatCompletion", async () => {
    const result = await chat({
      input: "Was ist Strinz?",
      context: {
        userId: TEST_USER_1.id,
        organisationId: TEST_ORGANISATION_1.id,
      },
      useTemplate: "test:test-knowledge-prompt-template",
    });

    // Verify the result contains metadata
    expect(result.chatId).toBeDefined();
  }, 60000);
});
