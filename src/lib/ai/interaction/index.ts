import * as v from "valibot";

export const chatInputValidation = v.object({
  chatId: v.optional(v.string()),
  context: v.optional(
    v.object({
      chatSessionGroupId: v.optional(v.string()),
    })
  ),
  startWithAssistant: v.optional(
    v.object({
      id: v.optional(v.string()),
      name: v.optional(v.string()),
      category: v.optional(v.string()),
    })
  ),
  variables: v.optional(
    v.record(v.string(), v.union([v.string(), v.number(), v.boolean()]))
  ),
  options: v.optional(
    v.object({
      model: v.optional(v.string()),
      maxTokens: v.optional(v.number()),
      temperature: v.optional(v.number()),
    })
  ),
});
