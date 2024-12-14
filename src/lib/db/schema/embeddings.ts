import {
  varchar,
  uuid,
  integer,
  text,
  vector,
  index,
  jsonb,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { pgBaseTable } from ".";

// Table embeddings for products or attachments
export const embeddings = pgBaseTable(
  "embeddings",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    sourceTable: varchar("source_table", { length: 255 }).notNull(),
    sourceId: uuid("source_id").notNull(),
    order: integer("order_number").notNull().default(0),
    section: varchar("section", { length: 1000 }).notNull().default(""),
    text: text("text").notNull().default(""),
    meta: jsonb("meta"),
    embeddingModel: varchar("embedding_model", { length: 255 })
      .notNull()
      .default("")
      .notNull(),
    textEmbedding: vector("text_embedding", { dimensions: 1536 }).notNull(),
  },
  (embedding) => [
    index("embeddings_source_table_index").on(embedding.sourceTable),
    index("embeddings_source_id_index").on(embedding.sourceId),
    index("embeddings_order_idx").on(embedding.order),
  ]
);

export type EmbeddingsSelect = typeof embeddings.$inferSelect;
export type EmbeddingsInsert = typeof embeddings.$inferInsert;
