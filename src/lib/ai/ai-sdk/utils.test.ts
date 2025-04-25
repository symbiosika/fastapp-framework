import { describe, test, expect, beforeAll } from "bun:test";
import { encodeImageFromFile, removeMarkdownImageUrls } from "./utils";
import { initTests } from "../../../test/init.test";

beforeAll(async () => {
  await initTests();
});

describe("AI SDK Utils", () => {
  test("encodeImageFromFile should encode a file as base64", async () => {
    // Create a test file
    const fileData = new Uint8Array([0x89, 0x50, 0x4e, 0x47]); // Dummy PNG header
    const file = new File([fileData], "test.png", { type: "image/png" });

    const result = await encodeImageFromFile(file);
    expect(result).toBe("iVBORw==");
  });

  test("removeMarkdownImageUrls should remove image URLs with specific patterns", () => {
    const testText = `
    Here is an image: 
    ![Schwein auf einem Misthaufen](http://localhost:3000/api/v1/organisation/ae9c2923-83a1-442e-876c-d6dc149f0243/files/db/default/5b20a950-f30f-4019-b8a9-bc6ff9e56fee.jpg)
    And here is more text and another image:
    ![Another image](http://localhost:3000/api/v1/organisation/12345/files/db/default/image.png)
    But this one should stay: 
    ![Normal image](https://example.com/image.jpg)
    `;

    const result = removeMarkdownImageUrls(testText);

    expect(result).not.toContain(
      "/api/v1/organisation/ae9c2923-83a1-442e-876c-d6dc149f0243/files/db/default/"
    );
    expect(result).not.toContain(
      "/api/v1/organisation/12345/files/db/default/"
    );
    expect(result).toContain("![Normal image](https://example.com/image.jpg)");
  });
});
