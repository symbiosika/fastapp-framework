export type PdfParserContext = {
  organisationId: string;
  userId?: string;
  teamId?: string;
  workspaceId?: string;
};

export type PdfParserOptions = {
  model?: string;
  extractImages?: boolean;
};

export type PdfParserResult = {
  text: string;
  includesImages: boolean;
  model: string;
};
