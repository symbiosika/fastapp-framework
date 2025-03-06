import log from "../../log";
import { extractKnowledgeFromText } from "../knowledge/add-knowledge";
import { getMarkdownFromUrl } from "../parsing/url";

/**
 * Add knowledge from an URL
 */
export const addKnowledgeTextFromUrl = async (data: {
  url: string;
  organisationId: string;
}) => {
  const markdown = await getMarkdownFromUrl(data.url);
  log.debug(`Got markdown from URL: ${markdown.slice(0, 100)}`);

  return extractKnowledgeFromText({
    organisationId: data.organisationId,
    title: data.url,
    text: markdown,
    sourceType: "external",
    sourceFileBucket: "default",
    sourceUrl: data.url,
  });
};
