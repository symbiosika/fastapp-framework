import log from "../../log";
import { extractKnowledgeFromText } from "../knowledge/add-knowledge";
import { getMarkdownFromUrl } from "../parsing/url";

/**
 * Add knowledge from an URL
 */
export const addKnowledgeTextFromUrl = async (data: {
  url: string;
  organisationId: string;
  userId: string;
  knowledgeGroupId?: string;
  teamId?: string;
  workspaceId?: string;
  userOwned?: boolean;
}) => {
  // regex validation for the URL
  const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
  if (!urlRegex.test(data.url)) {
    throw new Error("Invalid URL");
  }

  const markdown = await getMarkdownFromUrl(data.url);
  log.debug(`Got markdown from URL: ${markdown.slice(0, 25)}`);

  return extractKnowledgeFromText({
    organisationId: data.organisationId,
    knowledgeGroupId: data.knowledgeGroupId,
    teamId: data.teamId,
    workspaceId: data.workspaceId,
    userId: data.userId,
    userOwned: data.userOwned,
    title: data.url,
    text: markdown,
    sourceType: "external",
    sourceFileBucket: "default",
    sourceUrl: data.url,
    includesLocalImages: false,
  });
};
