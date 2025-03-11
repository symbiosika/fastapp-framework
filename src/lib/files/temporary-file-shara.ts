import { createApiToken } from "../auth/token-auth";

/**
 * Create a temporary file share link
 */
export const createFileShareToken = async (query: {
  userId: string;
  expiresIn?: number;
  organisationId: string;
}) => {
  const expiresIn = query.expiresIn ? query.expiresIn : 60;

  const token = createApiToken({
    name: "File Share Token",
    userId: query.userId,
    organisationId: query.organisationId,
    expiresIn,
    scopes: ["file:share"],
  });

  return token;
};
