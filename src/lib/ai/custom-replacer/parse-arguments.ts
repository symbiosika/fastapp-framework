import type { PlaceholderArgumentDict } from "./replacer";

/**
 * Try to parse in this order: boolean, number, string
 */
const parseBoolOrNumberOrString = (
  expression: string | undefined
): string | number | boolean | undefined => {
  if (expression === "true" || expression === "false") {
    return expression === "true";
  }
  if (!isNaN(Number(expression))) {
    return Number(expression);
  }
  return expression;
};

/**
 * A default argument parser
 * Will parse all arguments in the form of:
 * argument=value OR argument="value" OR argument='value'
 * All values in quotes or single quotes will be parsed as strings.
 * All other values will be parsed as boolean, number or string.
 *
 * selector is {{#<selector> argument1=value1 argument2=value2 ... }}
 */
export const parseArgumentsWithoutLimits = (
  rawContent: string,
  selector: string
): PlaceholderArgumentDict => {
  const regex = new RegExp(`{{#${selector}\\s*([^}]*)}}`);
  const matches = rawContent.match(regex);
  if (!matches || !matches[1]) {
    return {};
  }
  const argumentsString = matches[1].trim();
  if (!argumentsString) {
    return {};
  }

  // Regex to match key=(quoted_value | unquoted_value) OR 'quoted key'=(quoted_value | unquoted_value)
  const argRegex = /(\w+|'[^']+')=(\"[^\"]*\"|\'[^\']*\'|\S+)/g;
  const args = (argumentsString.match(argRegex) || []) as string[];

  return args.reduce<PlaceholderArgumentDict>((acc, argument: string) => {
    const match = argument.match(/^(\w+|'[^']+')=(.*)$/);
    if (!match) return acc;

    let key = match[1];
    const value = match[2];

    // Remove quotes from value if present
    const cleanValue = value.replace(/^[\"\']|[\"\']$/g, "");

    // Check if the key is quoted
    const isKeyQuoted = key.startsWith("'") && key.endsWith("'");

    // Remove quotes from key if quoted, otherwise convert snake_case to camelCase
    if (isKeyQuoted) {
      key = key.slice(1, -1); // Remove the surrounding single quotes
    } else {
      key = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    }

    acc[key] = parseBoolOrNumberOrString(cleanValue);
    return acc;
  }, {});
};
