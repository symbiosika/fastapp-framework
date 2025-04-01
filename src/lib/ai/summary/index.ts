import { chatCompletion } from "../ai-sdk";
import log from "../../../lib/log";
import type { UserContext } from "../ai-sdk/types";

/**
 * Generates a summary for a document using LLM
 */
export async function generateDocumentSummary(
  text: string,
  title: string,
  context: UserContext,
  options?: {
    customPrompt?: string;
    model?: string;
  }
): Promise<{ description: string }> {
  // Default prompt if no custom prompt is provided
  const prompt =
    options?.customPrompt ||
    `Generate a brief summary of the following document titled "${title}". ` +
      "Maintain the original language of the document. " +
      "Provide a concise description (2-3 sentences)";

  try {
    const result = await chatCompletion(
      [
        {
          role: "system",
          content: "You are a helpful assistant that summarizes documents.",
        },
        { role: "user", content: prompt + "\n\nDocument content:\n" + text },
      ],
      {
        organisationId: context.organisationId,
        userId: context.userId,
      },
      {
        providerAndModelName: options?.model,
        temperature: 0.3,
        maxTokens: 500,
      }
    );

    return {
      description: result.text,
    };
  } catch (e) {
    log.error(`Error generating summary for document: ${title}`, e + "");
    return {
      description: "",
    };
  }
}

/**
 * Generates summaries for chunks and combines them into a document summary
 */
export async function generateChunkBasedSummary(
  chunks: { text: string; header?: string }[],
  title: string,
  context: UserContext,
  options?: {
    customPrompt?: string;
    model?: string;
  }
): Promise<{ description: string }> {
  // Generate summaries for each chunk
  const chunkSummaries = await Promise.all(
    chunks.map(async (chunk) => {
      const chunkTitle = chunk.header || "Section";
      const prompt =
        `Summarize the following section "${chunkTitle}" from document "${title}". ` +
        "Provide 2-3 concise sentences capturing the key information. " +
        "Maintain the original language of the document.";

      try {
        const result = await chatCompletion(
          [
            {
              role: "system",
              content:
                "You are a helpful assistant that summarizes document sections.",
            },
            {
              role: "user",
              content: prompt + "\n\nSection content:\n" + chunk.text,
            },
          ],
          {
            organisationId: context.organisationId,
            userId: context.userId,
          },
          {
            providerAndModelName: options?.model,
            temperature: 0.3,
            maxTokens: 200,
          }
        );
        return result.text;
      } catch (e) {
        log.error(`Error generating summary for chunk: ${chunkTitle}`, e + "");
        return "";
      }
    })
  );

  // Filter out any empty summaries
  const validSummaries = chunkSummaries.filter((summary) => summary);

  if (validSummaries.length === 0) {
    return { description: "" };
  }

  // For a single chunk, just return its summary
  if (validSummaries.length === 1) {
    return { description: validSummaries[0] };
  }

  // For multiple chunks, combine the summaries
  const combinedSummaryPrompt =
    `Create a cohesive summary (2-3 sentences) for the document "${title}" ` +
    "based on the following section summaries. Maintain the original language of the document.";

  try {
    const result = await chatCompletion(
      [
        {
          role: "system",
          content:
            "You are a helpful assistant that combines section summaries into document summaries.",
        },
        {
          role: "user",
          content:
            combinedSummaryPrompt +
            "\n\nSection summaries:\n" +
            validSummaries.join("\n\n"),
        },
      ],
      {
        organisationId: context.organisationId,
        userId: context.userId,
      },
      {
        providerAndModelName: options?.model,
        temperature: 0.3,
        maxTokens: 300,
      }
    );

    return { description: result.text };
  } catch (e) {
    log.error(
      `Error generating combined summary for document: ${title}`,
      e + ""
    );
    // If combining fails, just concatenate the section summaries
    return { description: validSummaries.slice(0, 3).join(" ") };
  }
}
