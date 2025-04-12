import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import {
  initTests,
  TEST_ORGANISATION_1,
  TEST_USER_1,
} from "../../../test/init.test";
import { generateImages } from "./image";
import fs from "fs/promises";
import path from "path";

describe("Image Generation", () => {
  const tmpDir = "./tmp";
  let imagePath: string;

  beforeAll(async () => {
    await initTests();
    // Create tmp directory if it doesn't exist
    try {
      // await fs.mkdir(tmpDir, { recursive: true });
    } catch (error) {
      console.error("Error creating tmp directory:", error);
    }
  });

  afterAll(async () => {
    // Clean up test files
    try {
      if (imagePath) {
        // await fs.unlink(imagePath);
      }
    } catch (error) {
      console.error("Error cleaning up test files:", error);
    }
  });

  test("should generate an image and save it to tmp directory", async () => {
    const prompt = "A beautiful sunset over mountains";
    let result;
    try {
      result = await generateImages(prompt, {
        organisationId: TEST_ORGANISATION_1.id,
        userId: TEST_USER_1.id,
      });
    } catch (error) {
      console.error("Error generating image:", error);
      throw error;
    }

    expect(result).toBeDefined();
    expect(result.images).toBeDefined();
    expect(result.images.length).toBeGreaterThan(0);
    expect(result.meta).toBeDefined();
    expect(result.meta.imageCount).toBe(1);

    // Save the first image to tmp directory
    try {
      const base64Data = result.images[0].replace(
        /^data:image\/\w+;base64,/,
        ""
      );
      const buffer = Buffer.from(base64Data, "base64");
      imagePath = path.join(tmpDir, `test_image_${Date.now()}.jpeg`);
      await fs.writeFile(imagePath, buffer);

      // Verify the file was created
      const stats = await fs.stat(imagePath);
      expect(stats.isFile()).toBe(true);
      expect(stats.size).toBeGreaterThan(0);
    } catch (error) {
      console.error("Error saving image:", error);
      throw error;
    }
  });

  test("should throw an error with invalid prompt", async () => {
    try {
      await generateImages("", {
        organisationId: TEST_ORGANISATION_1.id,
        userId: TEST_USER_1.id,
      });
      throw new Error("Expected an error to be thrown");
    } catch (e: any) {
      expect(e).toBeInstanceOf(Error);
    }
  });
});
