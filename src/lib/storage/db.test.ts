import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { saveFileToDb, getFileFromDb, deleteFileFromDB } from "./db";
import {
  createDatabaseClient,
  waitForDbConnection,
  getDb,
} from "../db/db-connection";
import { files } from "../db/schema/files";
import { inArray } from "drizzle-orm";

let createdIds: string[] = [];

describe("Database Storage Operations", () => {
  beforeAll(async () => {
    await createDatabaseClient();
    await waitForDbConnection();
  });

  afterAll(async () => {
    // Clean up test data
    console.log("createdIds", createdIds);
    await getDb().delete(files).where(inArray(files.id, createdIds));
    process.exit(0);
  });

  const testBucket = "test-bucket";

  it("should perform complete CRUD operations on files in DB", async () => {
    // Create test File object
    const testContent = new Uint8Array([72, 101, 108, 108, 111]); // "Hello" in bytes
    const testFile = new File([testContent], "test.txt", {
      type: "text/plain",
    });

    // Save file to DB
    const savedFile = await saveFileToDb(testFile, testBucket);
    expect(savedFile.path).toContain("/api/v1/files/db/test-bucket/");
    expect(savedFile.path).toEndWith(".txt");
    expect(savedFile.id).toBeDefined();
    createdIds.push(savedFile.id);
    // Get file from DB
    const retrievedFile = await getFileFromDb(
      savedFile.id + ".txt",
      testBucket
    );
    expect(retrievedFile).toBeInstanceOf(File);
    expect(retrievedFile.name).toBe("test.txt");
    expect(retrievedFile.type).toStartWith("text/plain");

    // Verify file content
    const retrievedContent = await retrievedFile.arrayBuffer();
    expect(new Uint8Array(retrievedContent)).toEqual(testContent);

    // Delete file from DB
    console.log("deleting file", savedFile.id);
    await deleteFileFromDB(savedFile.id, testBucket);

    // Verify deletion
    console.log("verifying deletion");
    expect(getFileFromDb(savedFile.id, testBucket)).rejects.toThrow(
      "File not found"
    );
    console.log("deletion verified");
  });

  it("should handle non-existent files", async () => {
    expect(
      getFileFromDb("b26888c7-04ab-4ca4-a22a-4ed483bd1119", testBucket)
    ).rejects.toThrow("File not found");
  });

  it("should update existing file when saving with same ID", async () => {
    // Create initial test File
    const initialContent = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
    const initialFile = new File([initialContent], "test.txt", {
      type: "text/plain",
    });

    // Save initial file
    const savedFile = await saveFileToDb(initialFile, testBucket);

    // Create updated test File with same name
    const updatedContent = new Uint8Array([87, 111, 114, 108, 100]); // "World"
    const updatedFile = new File([updatedContent], "test.txt", {
      type: "text/plain",
    });

    // Save updated file
    const updatedSavedFile = await saveFileToDb(updatedFile, testBucket);
    createdIds.push(updatedSavedFile.id);

    // Verify updated content
    const retrievedFile = await getFileFromDb(updatedSavedFile.id, testBucket);
    const retrievedContent = await retrievedFile.arrayBuffer();
    expect(new Uint8Array(retrievedContent)).toEqual(updatedContent);

    // Cleanup
    await deleteFileFromDB(savedFile.id, testBucket);
  });
});
