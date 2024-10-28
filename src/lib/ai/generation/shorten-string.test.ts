import { describe, it, expect } from "bun:test";
import { shortenString } from ".";

describe("shortenString", () => {
  it("should return the original string if shorter than maxLength", () => {
    const input = "Hello World";
    const result = shortenString(input, 20);
    expect(result).toBe("Hello World");
  });

  it("should shorten string and add ellipsis if longer than maxLength", () => {
    const input = "This is a very long string that needs to be shortened";
    const result = shortenString(input, 10);
    expect(result).toBe("This is a ...");
  });

  it("should handle non-string inputs", () => {
    expect(shortenString(123, 10)).toBe("123");
    expect(shortenString(true, 10)).toBe("true");
    expect(shortenString(null, 10)).toBe("null");
    expect(shortenString(undefined, 10)).toBe("undefined");
  });

  it("should trim whitespace and replace newlines", () => {
    const input = "  Hello\nWorld\r\nTest  ";
    const result = shortenString(input, 20);
    expect(result).toBe("Hello World Test");
  });
});
