import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import {
  saveFileToLocalDisc,
  getFileFromLocalDisc,
  deleteFileFromLocalDisc,
} from "./local";
import { files } from "../db/schema/files";
import { inArray } from "drizzle-orm";

let createdIds: string[] = [];

describe("Local Storage Operations", () => {
  afterAll(async () => {
    // Clean up test data
    console.log("createdIds", createdIds);
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
    const savedFile = await saveFileToLocalDisc(testFile, testBucket);
    expect(savedFile.path).toContain("/api/v1/files/local/test-bucket/");
    expect(savedFile.path).toEndWith(".txt");
    expect(savedFile.id).toBeDefined();
    createdIds.push(savedFile.id);
    // Get file from DB
    try {
      const retrievedFile = await getFileFromLocalDisc(
        savedFile.id,
        testBucket
      );
      expect(retrievedFile).toBeInstanceOf(File);
      expect(retrievedFile.name).toBe("test.txt");
      expect(retrievedFile.type).toStartWith("text/plain");

      // Verify file content
      const retrievedContent = await retrievedFile.arrayBuffer();
      expect(new Uint8Array(retrievedContent)).toEqual(testContent);
    } catch (error) {
      console.log("error", error);
    }

    // Delete file from DB
    console.log("deleting file", savedFile.id);
    await deleteFileFromLocalDisc(savedFile.id, testBucket);

    // Verify deletion
    console.log("verifying deletion");
    expect(getFileFromLocalDisc(savedFile.id, testBucket)).rejects.toThrow(
      "File not found"
    );
    console.log("deletion verified");
  });

  it("should handle non-existent files", async () => {
    expect(
      getFileFromLocalDisc("b26888c7-04ab-4ca4-a22a-4ed483bd1119", testBucket)
    ).rejects.toThrow("File not found");
  });

  it("should update existing file when saving with same ID", async () => {
    // Create initial test File
    const initialContent = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
    const initialFile = new File([initialContent], "test.txt", {
      type: "text/plain",
    });

    // Save initial file
    const savedFile = await saveFileToLocalDisc(initialFile, testBucket);

    // Create updated test File with same name
    const updatedContent = new Uint8Array([87, 111, 114, 108, 100]); // "World"
    const updatedFile = new File([updatedContent], "test.txt", {
      type: "text/plain",
    });

    // Save updated file
    const updatedSavedFile = await saveFileToLocalDisc(updatedFile, testBucket);
    createdIds.push(updatedSavedFile.id);

    // Verify updated content
    try {
      const retrievedFile = await getFileFromLocalDisc(
        updatedSavedFile.id,
        testBucket
      );
      const retrievedContent = await retrievedFile.arrayBuffer();
      expect(new Uint8Array(retrievedContent)).toEqual(updatedContent);
    } catch (error) {
      throw error;
    }

    // Cleanup
    await deleteFileFromLocalDisc(savedFile.id, testBucket);
  });
});
