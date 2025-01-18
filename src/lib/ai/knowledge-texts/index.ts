import { getDb } from "../../db/db-connection";
import { knowledgeText } from "../../db/db-schema";
import log from "../../log";
import { getMarkdownFromUrl } from "../parsing/url";

/**
 * Add knowledge from an URL
 */
export const addKnowledgeTextFromUrl = async (data: {
  url: string;
  organisationId: string;
}) => {
  const markdown = await getMarkdownFromUrl(data.url);
  log.debug(`Markdown: ${markdown.slice(0, 100)}`);

  // insert in DB as text knowledge entry
  const e = await getDb()
    .insert(knowledgeText)
    .values({
      text: markdown,
      title: data.url,
      organisationId: data.organisationId,
    })
    .returning({
      id: knowledgeText.id,
      title: knowledgeText.title,
      createdAt: knowledgeText.createdAt,
    });

  return e[0];
};
