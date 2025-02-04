import { describe, it, expect, beforeAll } from "bun:test";
import {
  createKnowledgeText,
  readKnowledgeText,
  updateKnowledgeText,
  deleteKnowledgeText,
} from "./knowledge-texts";
import {
  createDatabaseClient,
  waitForDbConnection,
} from "../../db/db-connection";
import { initTestOrganisation } from "../../../test/init.test";

describe("Knowledge Texts Test", () => {
  beforeAll(async () => {
    await createDatabaseClient();
    await waitForDbConnection();
    await initTestOrganisation();
  });

  it("should create a new knowledge text entry", async () => {
    const newText = {
      text: "Test knowledge text",
      title: "Test Title",
      organisationId: "00000000-1111-1111-1111-000000000000",
    };

    const createdText = await createKnowledgeText(newText);
    expect(createdText).toHaveProperty("id");
    expect(createdText.text).toBe(newText.text);
    expect(createdText.title).toBe(newText.title);
  });

  it("should read a knowledge text entry by ID", async () => {
    const newText = {
      text: "Another test knowledge text",
      title: "Another Test Title",
      organisationId: "00000000-1111-1111-1111-000000000000",
    };

    const createdText = await createKnowledgeText(newText);
    const readText = await readKnowledgeText({
      id: createdText.id,
      organisationId: createdText.organisationId,
    });

    expect(readText.length).toBe(1);
    expect(readText[0].text).toBe(newText.text);
    expect(readText[0].title).toBe(newText.title);
  });

  it("should update a knowledge text entry", async () => {
    const newText = {
      text: "Text to be updated",
      title: "Title to be updated",
      organisationId: "00000000-1111-1111-1111-000000000000",
    };

    const createdText = await createKnowledgeText(newText);
    const updatedText = await updateKnowledgeText(createdText.id, {
      text: "Updated text",
      title: "Updated title",
      organisationId: createdText.organisationId,
    },
      {
        organisationId: createdText.organisationId,
      }
    );

    expect(updatedText.text).toBe("Updated text");
    expect(updatedText.title).toBe("Updated title");
  });

  it("should delete a knowledge text entry", async () => {
    const newText = {
      text: "Text to be deleted",
      title: "Title to be deleted",
      organisationId: "00000000-1111-1111-1111-000000000000",
    };

    const createdText = await createKnowledgeText(newText);
    const deletedText = await deleteKnowledgeText(
      createdText.id,
      {
        organisationId: createdText.organisationId,
      }
    );

    expect(deletedText.success).toBe(true);

    const readText = await readKnowledgeText({
      id: createdText.id,
      organisationId: createdText.organisationId,
    });
    expect(readText.length).toBe(0);
  });
});
