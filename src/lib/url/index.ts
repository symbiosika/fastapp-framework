/**
 * Try to parse a number from undefined or string
 */
export const parseNumberFromUrlParam = (
  value: string | undefined,
  defaultValue?: number
) => {
  return value ? parseInt(value) : defaultValue;
};

/**
 * Try to parse a comma separated list of strings from undefined or string
 */
export const parseCommaSeparatedListFromUrlParam = (
  value: string | undefined,
  defaultValue?: string[]
) => {
  return value ? value.split(",") : defaultValue;
};
