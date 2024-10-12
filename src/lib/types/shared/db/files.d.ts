/*
import type { files } from "src/lib/db/schema/files";
type FilesEntry = typeof files.$inferSelect;
type InsertFilesEntry = typeof files.$inferInsert;
*/

export type FilesEntry = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  bucket: string;
  fileType: string;
  file: Buffer;
};

export type InsertFilesEntry = {
  name: string;
  bucket: string;
  fileType: string;
  file: Buffer;
  id?: string | undefined;
  createdAt?: string | undefined;
  updatedAt?: string | undefined;
};
