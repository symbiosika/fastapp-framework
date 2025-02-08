/**
 * Parse an unknown value to a number
 */
export const parseIntFromUnknown = (
  value: unknown,
  defaultValue: number
): number => {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    const parsed = parseInt(value);
    if (!isNaN(parsed)) {
      return parsed;
    }
  }
  return defaultValue;
};

/**
 * Parse an unknown value to a boolean
 */
export const parseBooleanFromUnknown = (
  value: unknown,
  defaultValue: boolean
): boolean => {
  if (typeof value === "boolean") {
    return value;
  }
  return defaultValue;
};

/**
 * Parse an unknown value to a string
 */
export const parseStringFromUnknown = (
  value: unknown,
  defaultValue: string
): string => {
  return typeof value === "string" ? value : defaultValue;
};
