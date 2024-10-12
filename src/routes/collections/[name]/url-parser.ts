import {
  SQL,
  and,
  or,
  eq,
  ne,
  gt,
  gte,
  lt,
  lte,
  like,
  notLike,
  isNull,
  isNotNull,
  desc,
  asc,
} from "drizzle-orm";
import type { DatabaseSchema } from "../../../lib/db/db-schema";

type Operator =
  | "=" // eq
  | "!=" // ne
  | ">" // gt
  | ">=" // gte
  | "<" // lt
  | "<=" // lte
  | "~" // like
  | "!~" // notLike
  | "?=" // Any/At least one of Equal
  | "?!=" // Any/At least one of NOT equal
  | "?>" // Any/At least one of Greater than
  | "?>=" // Any/At least one of Greater than or equal
  | "?<" //  Any/At least one of Less than
  | "?<=" // Any/At least one of Less than or equal
  | "?~" // Any/At least one of Like/Contains (if not specified auto wraps the right string OPERAND in a "%" for wildcard match)
  | "?!~"; // Any/At least one of NOT Like/Contains (if not specified auto wraps the right string OPERAND in a "%" for wildcard match)

type TokenType =
  | "OpenParen"
  | "CloseParen"
  | "And"
  | "Or"
  | "Operator"
  | "Identifier"
  | "Value";

interface Token {
  type: TokenType;
  value: string;
}

// AST Node Types
type ASTNode =
  | {
      type: "LogicalExpression";
      operator: "&&" | "||";
      left: ASTNode;
      right: ASTNode;
    }
  | {
      type: "ComparisonExpression";
      field: string;
      operator: Operator;
      value: string | number | boolean | null;
    }
  | { type: "Grouping"; expression: ASTNode };

export function parseFilterClause(
  filterString: string | undefined
): ASTNode | undefined {
  if (!filterString) {
    return undefined;
  }
  // Tokenize the filter string
  const tokens = tokenize(filterString);
  // Parse the tokens into an AST
  const parser = new Parser(tokens);
  const ast = parser.parse();
  return ast;
}

function tokenize(input: string): Token[] {
  // console.log("Tokenizing input:", input);

  const tokens: Token[] = [];
  let current = 0;
  const operators = [
    "?!~",
    "?!=",
    "?>=",
    "?<=",
    "?>",
    "?<",
    "?=",
    "?~",
    ">=",
    "<=",
    "!=",
    "!~",
    "~",
    "=",
    ">",
    "<",
  ];

  while (current < input.length) {
    let char = input[current];

    // Skip whitespace
    if (/\s/.test(char)) {
      current++;
      continue;
    }

    // Parentheses
    if (char === "(") {
      tokens.push({ type: "OpenParen", value: "(" });
      current++;
      continue;
    }

    if (char === ")") {
      tokens.push({ type: "CloseParen", value: ")" });
      current++;
      continue;
    }

    // Logical operators
    if (input.substr(current, 2) === "&&") {
      tokens.push({ type: "And", value: "&&" });
      current += 2;
      continue;
    }

    if (input.substr(current, 2) === "||") {
      tokens.push({ type: "Or", value: "||" });
      current += 2;
      continue;
    }

    // Operators
    let matchedOperator = null;
    for (let op of operators) {
      if (input.substr(current, op.length) === op) {
        matchedOperator = op;
        break;
      }
    }

    if (matchedOperator) {
      tokens.push({ type: "Operator", value: matchedOperator });
      current += matchedOperator.length;
      continue;
    }

    // Identifiers (field names, now including dots)
    if (/[a-zA-Z_]/.test(char)) {
      let value = "";
      while (/[a-zA-Z0-9_.]/.test(char)) {
        value += char;
        current++;
        char = input[current];
      }
      tokens.push({ type: "Identifier", value });
      continue;
    }

    // Values (strings enclosed in single quotes or ISO date strings)
    if (char === "'" || /\d{4}-\d{2}-\d{2}/.test(input.substr(current, 10))) {
      let value = "";
      if (char === "'") {
        current++; // Skip opening quote
        char = input[current];
        while (char !== "'" && current < input.length) {
          value += char;
          current++;
          char = input[current];
        }
        if (char === "'") {
          current++; // Skip closing quote
        } else {
          throw new Error("Unterminated string literal");
        }
      } else {
        // Handle ISO date string
        while (/[\d-T:]/.test(char) && current < input.length) {
          value += char;
          current++;
          char = input[current];
        }
      }
      tokens.push({ type: "Value", value });
      continue;
    }

    // Numbers
    if (/[0-9]/.test(char)) {
      let value = "";
      while (/[0-9\.]/.test(char)) {
        value += char;
        current++;
        char = input[current];
      }
      tokens.push({ type: "Value", value });
      continue;
    }

    throw new Error(`Unrecognized character at position ${current}: '${char}'`);
  }

  return tokens;
}

class Parser {
  tokens: Token[];
  current: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): ASTNode {
    return this.parseExpression();
  }

  parseExpression(): ASTNode {
    return this.parseLogicalOr();
  }

  parseLogicalOr(): ASTNode {
    let left = this.parseLogicalAnd();
    while (this.match("Or")) {
      let operator = this.previous().value as "||";
      let right = this.parseLogicalAnd();
      left = { type: "LogicalExpression", operator, left, right };
    }
    return left;
  }

  parseLogicalAnd(): ASTNode {
    let left = this.parseComparison();
    while (this.match("And")) {
      let operator = this.previous().value as "&&";
      let right = this.parseComparison();
      left = { type: "LogicalExpression", operator, left, right };
    }
    return left;
  }

  parseComparison(): ASTNode {
    if (this.match("OpenParen")) {
      let expr = this.parseExpression();
      this.consume("CloseParen", "Expect ')' after expression.");
      return { type: "Grouping", expression: expr };
    }

    if (this.match("Identifier")) {
      let field = this.previous().value;
      if (this.match("Operator")) {
        let operator = this.previous().value as Operator;
        if (this.match("Value")) {
          let value = this.previous().value;
          // Convert ISO date string to Date object
          if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
            value = new Date(value).toISOString();
          }
          return { type: "ComparisonExpression", field, operator, value };
        } else {
          throw new Error("Expected value after operator");
        }
      } else {
        throw new Error("Expected operator after field");
      }
    } else {
      throw new Error("Expected field identifier");
    }
  }

  match(...types: TokenType[]): boolean {
    for (let type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    throw new Error(message);
  }

  check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  isAtEnd(): boolean {
    return this.current >= this.tokens.length;
  }

  peek(): Token {
    return this.tokens[this.current];
  }

  previous(): Token {
    return this.tokens[this.current - 1];
  }
}

// Assuming DatabaseSchema is defined somewhere as a mapping from table names to table structures
type SingleTable<T extends keyof DatabaseSchema> = DatabaseSchema[T];

/**
 * Map the AST to Drizzle ORM query conditions for the where clause
 */
export function mapConditionsToDrizzleWhereObject<
  K extends keyof DatabaseSchema,
>(
  tables: { [key in K]: SingleTable<K> },
  defaultTable: K,
  ast?: ASTNode
): { [key in K]?: SQL | undefined } {
  if (!ast) return {};

  const result: { [key in K]?: SQL | undefined } = {};

  function processNode(node: ASTNode): SQL | undefined {
    switch (node.type) {
      case "LogicalExpression":
        const left = processNode(node.left);
        const right = processNode(node.right);
        if (node.operator === "&&") {
          return and(left, right);
        } else {
          return or(left, right);
        }
      case "ComparisonExpression":
        const splittedField = node.field.split(".");
        const tableName =
          splittedField.length > 1 ? splittedField[0] : defaultTable;
        const table = tables[tableName as K];

        if (!table) {
          throw new Error(`table ${tableName} not found in schema`);
        }
        const columnName =
          splittedField.length > 1 ? splittedField[1] : splittedField[0];

        const columnKey = table[columnName as keyof typeof table] ?? null;
        if (!columnKey) {
          throw new Error(`column ${columnName} not found in ${tableName}`);
        }

        const value = node.value === "null" ? null : node.value;
        let condition: SQL;
        switch (node.operator) {
          case "=":
            condition = eq(columnKey as any, value);
            break;
          case "!=":
            condition = ne(columnKey as any, value);
            break;
          case ">":
            condition = gt(columnKey as any, value);
            break;
          case ">=":
            condition = gte(columnKey as any, value);
            break;
          case "<":
            condition = lt(columnKey as any, value);
            break;
          case "<=":
            condition = lte(columnKey as any, value);
            break;
          case "~":
            condition = like(columnKey as any, value as any);
            break;
          case "!~":
            condition = notLike(columnKey as any, value as any);
            break;
          case "?=":
            condition = isNull(columnKey as any);
            break;
          case "?!=":
            condition = isNotNull(columnKey as any);
            break;
          default:
            throw new Error(`Unsupported operator ${node.operator}`);
        }

        if (result[tableName as K]) {
          result[tableName as K] = and(result[tableName as K]!, condition);
        } else {
          result[tableName as K] = condition;
        }
        return condition;
      case "Grouping":
        return processNode(node.expression);
      default:
        throw new Error("Invalid AST Node");
    }
  }

  processNode(ast);
  return result;
}

/**
 * Get "orderBy" in Drizzle format
 */
export const getOrderBy = (
  orderBy: string | undefined,
  table: any,
  ascending = true
): SQL<unknown>[] | undefined => {
  if (!orderBy) return undefined;

  const columnKey = table[orderBy as keyof typeof table] ?? null;
  if (!columnKey) {
    console.error(`column ${orderBy} not found in table`);
    throw new Error(`column ${orderBy} not found in table`);
  }
  if (ascending) return [asc(columnKey)];
  else return [desc(columnKey)];
};
