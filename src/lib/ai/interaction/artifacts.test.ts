import { describe, test, expect } from "bun:test";

/**
 * Extracts organization ID and file ID from a valid file URL
 * @param url The file URL to parse
 * @returns Object containing organisationId and fileId, or null if URL is invalid
 */
export const parseFileUrl = (
  url: string
): { organisationId: string; fileId: string } | null => {
  // Check if URL starts with http(s)
  if (!url.match(/^https?:\/\//)) {
    return null;
  }

  // Match the pattern: /api/v1/organisation/{guid}/files/{db|local}/default/{id}
  const pattern =
    /\/api\/v1\/organisation\/([0-9a-f-]+)\/files\/(db|local)\/default\/([0-9a-f-]+)/i;
  const match = url.match(pattern);

  if (!match) {
    return null;
  }

  return {
    organisationId: match[1],
    fileId: match[3],
  };
};

describe("parseFileUrl", () => {
  test("should parse valid file URL correctly", () => {
    const url =
      "http://localhost:5173/api/v1/organisation/ae9c2923-83a1-442e-876c-d6dc149f0243/files/db/default/1eb9766a-4d32-4a7d-bf3f-1734e8a2d46c.png";
    const result = parseFileUrl(url);

    expect(result).not.toBeNull();
    expect(result).toEqual({
      organisationId: "ae9c2923-83a1-442e-876c-d6dc149f0243",
      fileId: "1eb9766a-4d32-4a7d-bf3f-1734e8a2d46c",
    });
  });

  test("should return null for invalid URL format", () => {
    const invalidUrls = [
      "ftp://example.com/api/v1/organisation/123/files/db/default/456", // Wrong protocol
      "http://example.com/api/v1/organisation/123/files/invalid/default/456", // Invalid storage type
      "http://example.com/api/v1/organisation/123/files/db/other/456", // Wrong path segment
      "http://example.com/api/v1/organisation/123/files/db/default", // Missing file ID
      "http://example.com/api/v1/organisation/123/files/db/default/", // Missing file ID
    ];

    invalidUrls.forEach((url) => {
      expect(parseFileUrl(url)).toBeNull();
    });
  });

  test("should handle different storage types", () => {
    const dbUrl =
      "http://localhost:5173/api/v1/organisation/ae9c2923-83a1-442e-876c-d6dc149f0243/files/db/default/1eb9766a-4d32-4a7d-bf3f-1734e8a2d46c.png";
    const localUrl =
      "http://localhost:5173/api/v1/organisation/ae9c2923-83a1-442e-876c-d6dc149f0243/files/local/default/1eb9766a-4d32-4a7d-bf3f-1734e8a2d46c.png";

    expect(parseFileUrl(dbUrl)).not.toBeNull();
    expect(parseFileUrl(localUrl)).not.toBeNull();
  });
});
