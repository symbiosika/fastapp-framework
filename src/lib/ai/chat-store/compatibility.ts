import * as v from "valibot";

export const chatInitInputValidation = v.object({
  chatId: v.optional(v.string()),
  chatSessionGroupId: v.optional(v.string()),
  initiateTemplate: v.optional(
    v.object({
      promptId: v.optional(v.string()),
      promptName: v.optional(v.string()),
      promptCategory: v.optional(v.string()),
      organisationId: v.optional(v.string()),
    })
  ),
  trigger: v.optional(
    v.object({
      next: v.boolean(),
      skip: v.boolean(),
    })
  ),
  variables: v.optional(v.record(v.string(), v.string())),
  llmOptions: v.optional(
    v.object({
      model: v.optional(v.string()),
      maxTokens: v.optional(v.number()),
      temperature: v.optional(v.number()),
    })
  ),
});

export const chatInitValidation = v.intersect([
  v.object({
    userId: v.string(),
    organisationId: v.string(),
  }),
  chatInitInputValidation,
]);
type ChatInitInput = v.InferOutput<typeof chatInitValidation>;

export const chatWithTemplateReturnValidation = v.object({
  chatId: v.string(),
  message: v.object({
    role: v.union([v.literal("user"), v.literal("assistant")]),
    content: v.string(),
  }),
  meta: v.any(),
  finished: v.optional(v.boolean()),
  render: v.optional(
    v.union([
      v.object({
        type: v.literal("text"),
      }),
      v.object({
        type: v.literal("image"),
        url: v.string(),
      }),
      v.object({
        type: v.literal("box"),
        severity: v.union([
          v.literal("info"),
          v.literal("warning"),
          v.literal("error"),
        ]),
      }),
      v.object({
        type: v.literal("markdown"),
      }),
      v.object({
        type: v.literal("form"),
        definition: v.array(v.any()), // GenericFormEntry[] type
        data: v.record(v.string(), v.any()),
      }),
    ])
  ),
});
type ChatWithTemplateReturn = v.InferOutput<
  typeof chatWithTemplateReturnValidation
>;
