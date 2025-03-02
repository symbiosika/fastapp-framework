import type { ChatStoreVariables, PlaceholderArgumentDict } from "./chat-store";

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

const getIndexValue = (variables: ChatStoreVariables, indexName: string) => {
  if (
    !variables[indexName] ||
    typeof variables[indexName] !== "number" ||
    isNaN(variables[indexName])
  ) {
    variables[indexName] = 0;
  }
  return variables[indexName];
};

const incrementIndexValue = (
  variables: ChatStoreVariables,
  indexName: string
) => {
  const ixValue = getIndexValue(variables, indexName);
  variables[indexName] = ixValue + 1;
};

export {
  getStringArgument,
  getStringArrayArgument,
  getBooleanArgument,
  getNumberArgument,
  getIndexValue,
  incrementIndexValue,
  isNumber,
};
