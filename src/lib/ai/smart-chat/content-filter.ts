import { openaiClient } from "../standard";

export const isContentAllowed = async (message: string): Promise<boolean> => {
  const response = await openaiClient.moderations.create({
    input: message,
  });

  const { flagged } = response.results[0];

  // You can add additional custom checks here
  const isRelevant = true; // Implement your relevance logic

  return !flagged && isRelevant;
};
