import { describe, test, expect, beforeAll } from "bun:test";
import { parsePdfFileAsMardownLocal } from "./local-service";
import fs from "fs";
import path from "path";

import { TEST_ORGANISATION_1 } from "../../../../test/init.test";

describe("Local PDF Parser Service", () => {
  const TEST_PDF_PATH = path.join(
    process.cwd(),
    "src",
    "fastapp-framework",
    "src",
    "test",
    "files",
    "example_knowlede.pdf"
  );

  beforeAll(() => {
    // environment variables are set!
  });

  test("should successfully parse a PDF file", async () => {
    // Read the test PDF file
    const fileBuffer = await fs.promises.readFile(TEST_PDF_PATH);
    const file = new File([fileBuffer], "example_knowledge.pdf", {
      type: "application/pdf",
    });

    const result = await parsePdfFileAsMardownLocal(file, {
      organisationId: TEST_ORGANISATION_1.id,
    });

    // Basic validation of the result
    expect(result).toBeDefined();
    expect(result.pages).toBeDefined();
    expect(result.pages?.length).toBeGreaterThan(0);
  }, 30000);
});
