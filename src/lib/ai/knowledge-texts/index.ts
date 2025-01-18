import { getDb } from "../../db/db-connection";
import { knowledgeText } from "../../db/db-schema";
import log from "../../log";
import { getMarkdownFromUrl } from "../parsing/url";

/**
 * Add knowledge from an URL
 */
export const addKnowledgeFromUrl = async (data: {
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

/**
 * Add plain knowledge text to the database
 */
export const addPlainKnowledgeText = async (data: {
  text: string;
  title?: string;
  meta?: Record<string, string | number | boolean | undefined>;
  organisationId: string;
}) => {
  const e = await getDb()
    .insert(knowledgeText)
    .values({ ...data })
    .returning();
  return e[0];
};
