import { Tool } from "ai";

export type ToolReturn = {
  name: string;
  tool: Tool;
};

export type ToolContext = {
  chatId: string;
  userId: string;
  organisationId: string;
};

export interface OrganisationContext {
  organisationId: string;
  userId?: string;
  chatId?: string;
}

export interface UserContext {
  organisationId: string;
  userId: string;
  chatId?: string;
}

export interface SourceReturn {
  type: "url" | "knowledge-chunk" | "knowledge-entry" | "file";
  label: string;
  id?: string;
  url?: string;
  external?: boolean;
}

export type ArtifactReturn = {
  type: "image" | "audio" | "video" | "file";
  url?: string;
  label?: string;
  external?: boolean;
};
