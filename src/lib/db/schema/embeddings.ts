import {
  varchar,
  uuid,
  integer,
  text,
  vector,
  index,
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
    section: varchar("section", { length: 255 }).notNull().default(""),
    text: text("text").notNull().default(""),
    embeddingModel: varchar("embedding_model", { length: 255 })
      .notNull()
      .default("")
      .notNull(),
    textEmbedding: vector("text_embedding", { dimensions: 1536 }).notNull(),
  },
  (embedding) => ({
    tableIndex: index("table_index").on(embedding.sourceTable),
    sourceIdIndex: index("source_id_index").on(embedding.sourceId),
  })
);
