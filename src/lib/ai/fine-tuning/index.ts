import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "../../db/db-connection";
import { fineTuningData, knowledgeEntry } from "../../db/db-schema";

type FineTuningDataInput = {
  data: {
    question: string;
    answer: string;
  }[];
  name?: string;
  category?: string;
};

/**
 * Get one fine-tuning entry by id
 */
export const getFineTuningEntryById = async (id: string) => {
  return await getDb().query.fineTuningData.findFirst({
    where: eq(fineTuningData.id, id),
  });
};

/**
 * Get all fine-tuning entries
 * Filtered by name and category
 */
export const getFineTuningEntries = async (query?: {
  names?: string[];
  categories?: string[];
}) => {
  let where;
  if (query?.names && query.names.length > 0) {
    where = inArray(fineTuningData.name, query.names);
  } else if (query?.categories && query.categories.length > 0) {
    where = inArray(fineTuningData.category, query.categories);
  } else if (
    query?.names &&
    query.names.length > 0 &&
    query?.categories &&
    query.categories.length > 0
  ) {
    where = and(
      inArray(fineTuningData.name, query.names),
      inArray(fineTuningData.category, query.categories)
    );
  }

  const data = await getDb().query.fineTuningData.findMany({
    where,
    with: {
      knowledgeEntry: true,
    },
  });

  return data;
};

/**
 * Add fine-tuning data
 */
export const addFineTuningData = async (input: FineTuningDataInput) => {
  // Create knowledge entry first
  const knowledgeEntryResult = await getDb()
    .insert(knowledgeEntry)
    .values({
      fileSourceType: "finetuning",
      name: input.name || "Unnamed Fine-tuning Dataset",
      description: `Fine-tuning dataset${input.category ? ` for ${input.category}` : ""}`,
    })
    .returning();

  // Insert all QA pairs
  await getDb()
    .insert(fineTuningData)
    .values(
      input.data.map((item) => ({
        knowledgeEntryId: knowledgeEntryResult[0].id,
        name: input.name,
        category: input.category,
        question: item.question,
        answer: item.answer,
      }))
    )
    .returning();

  return knowledgeEntryResult;
};

/**
 * Update fine-tuning data
 */
export const updateFineTuningData = async (
  id: string,
  input: FineTuningDataInput
) => {
  // Delete existing data
  await getDb().delete(fineTuningData).where(eq(fineTuningData.id, id));

  // Insert new data
  const fineTuningEntries = await getDb()
    .insert(fineTuningData)
    .values(
      input.data.map((item) => ({
        knowledgeEntryId: id,
        name: input.name,
        category: input.category,
        question: item.question,
        answer: item.answer,
      }))
    )
    .returning();

  return fineTuningEntries;
};

/**
 * Delete fine-tuning data
 */
export const deleteFineTuningData = async (id: string) => {
  await getDb().delete(fineTuningData).where(eq(fineTuningData.id, id));
};
