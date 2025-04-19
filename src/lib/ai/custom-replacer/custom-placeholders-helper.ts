import type { PlaceholderArgumentDict } from "./replacer";

function getStringArgument(
  args: PlaceholderArgumentDict,
  name: string,
  defaultValue: string
): string;
function getStringArgument(
  args: PlaceholderArgumentDict,
  name: string,
  defaultValue?: string
): string | undefined;

function getStringArgument(
  args: PlaceholderArgumentDict,
  name: string,
  defaultValue?: string
): string | undefined {
  const value = args[name];
  if (value == undefined) {
    return defaultValue;
  }
  if (typeof value === "string") {
    return value;
  }
  return defaultValue;
}

function getStringArrayArgument(
  args: PlaceholderArgumentDict,
  name: string,
  defaultValue: string[]
): string[];
function getStringArrayArgument(
  args: PlaceholderArgumentDict,
  name: string,
  defaultValue?: string[]
): string[] | undefined;

function getStringArrayArgument(
  args: PlaceholderArgumentDict,
  name: string,
  defaultValue?: string[]
): string[] | undefined {
  const value = args[name];
  if (value == undefined) {
    return defaultValue;
  }
  if (typeof value === "string") {
    return value.split(",");
  }
  return defaultValue;
}

function getBooleanArgument(
  args: PlaceholderArgumentDict,
  name: string,
  defaultValue: boolean
): boolean;
function getBooleanArgument(
  args: PlaceholderArgumentDict,
  name: string,
  defaultValue?: boolean
): boolean | undefined;

function getBooleanArgument(
  args: PlaceholderArgumentDict,
  name: string,
  defaultValue?: boolean
): boolean | undefined {
  const value = args[name];
  if (value == undefined) {
    return defaultValue;
  }
  if (typeof value === "boolean") {
    return value;
  }
  return defaultValue;
}

// Overload signatures
function getNumberArgument(
  args: PlaceholderArgumentDict,
  name: string,
  defaultValue: number
): number;
function getNumberArgument(
  args: PlaceholderArgumentDict,
  name: string,
  defaultValue?: number
): number | undefined;

// Implementation
function getNumberArgument(
  args: PlaceholderArgumentDict,
  name: string,
  defaultValue?: number
): number | undefined {
  const value = args[name];
  if (value == undefined) {
    return defaultValue;
  }
  if (typeof value === "number") {
    return value;
  }
  return defaultValue;
}

const isNumber = (value: unknown): number | null | undefined => {
  if (value && typeof value === "number" && !isNaN(value)) {
    return value;
  }
  return null;
};

export {
  getStringArgument,
  getStringArrayArgument,
  getBooleanArgument,
  getNumberArgument,
  isNumber,
};

/**
 * Parses a comma-separated string where values can be optionally quoted.
 * Handles commas within quoted values.
 * Example: '"value 1","value 2, ok",value3' -> ["value 1", "value 2, ok", "value3"]
 */
export const parseCommaSeparatedPossiblyQuotedString = (
  input: string | undefined
): string[] => {
  if (!input) {
    return [];
  }

  const result: string[] = [];
  // Regex to find comma-separated values, handling quotes
  // It matches either a double-quoted string, a single-quoted string,
  // or an unquoted value that doesn't start with space/comma/quote and contains no commas.
  const regex = /\"([^\"]*)\"|\'([^\']*)\'|([^,\s\'\"][^,]*)/g;
  let match;

  while ((match = regex.exec(input)) !== null) {
    // match[1] is double-quoted content (keep as is)
    // match[2] is single-quoted content (keep as is)
    // match[3] is unquoted content (trim this one)
    if (match[1] !== undefined) {
      result.push(match[1]);
    } else if (match[2] !== undefined) {
      result.push(match[2]);
    } else if (match[3] !== undefined) {
      result.push(match[3].trim()); // Trim only unquoted values
    }
  }

  // Remove the final map trim as trimming is now done selectively
  return result;
};
