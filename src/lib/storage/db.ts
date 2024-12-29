import { and, eq } from "drizzle-orm";
import { getDb } from "../db/db-connection";
import { files } from "../db/schema/files";
import type {
  SaveFileFunction,
  DeleteFileFunction,
  GetFileFunction,
} from "./types";

const getIdFromFileName = (fileName: string) => {
  return fileName.split(".")[0] || "";
};

export const saveFileToDb: SaveFileFunction = async (
  file,
  bucket,
  organisationId
) => {
  try {
    // Convert the file to a buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name;
    const fileExtension = fileName.split(".").pop()?.toLowerCase() || "";

    const entry = {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      bucket: bucket,
      organisationId: organisationId,
      name: fileName, // original file name
      fileType: file.type,
      file: fileBuffer,
      extension: fileExtension,
    };

    // Insert the file into the database
    const e = await getDb()
      .insert(files)
      .values(entry)
      .onConflictDoUpdate({
        target: files.id,
        set: entry,
      })
      .returning();

    if (e.length === 0) {
      throw new Error("no row created");
    }
    return {
      path: `/api/v1/files/db/${bucket}/${e[0].id}${fileExtension !== "" ? `.${fileExtension}` : ""}`,
      id: e[0].id,
      name: e[0].name,
      organisationId: organisationId,
    };
  } catch (error) {
    throw new Error("Failed to save file to database. " + error);
  }
};

export const getFileFromDb: GetFileFunction = async (
  name,
  bucket,
  organisationId
) => {
  try {
    const id = getIdFromFileName(name);

    // Retrieve the file record from the database
    const fileRecord = await getDb()
      .select()
      .from(files)
      .where(
        and(
          eq(files.id, id),
          eq(files.bucket, bucket),
          eq(files.organisationId, organisationId)
        )
      );

    if (fileRecord.length === 0) {
      throw new Error("File not found");
    }
    const file = fileRecord[0];

    // Create and return a File object
    return new File([file.file], file.name, { type: file.fileType });
  } catch (error) {
    throw new Error("Failed to get file from database. " + error);
  }
};

export const deleteFileFromDB: DeleteFileFunction = async (
  name,
  bucket,
  organisationId
) => {
  try {
    const id = name.split("/").pop() || "";

    // Delete the file record from the database
    await getDb()
      .delete(files)
      .where(
        and(
          eq(files.id, id),
          eq(files.bucket, bucket),
          eq(files.organisationId, organisationId)
        )
      );
  } catch (error) {
    throw new Error("Failed to delete file from database. " + error);
  }
};
