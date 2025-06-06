import fs from "fs";
import path from "path";
import {
  Project,
  SyntaxKind,
  CallExpression,
  Node,
  ObjectLiteralExpression,
} from "ts-morph";

const project = new Project({
  tsConfigFilePath: path.join(__dirname, "../tsconfig.json"),
});

const schemaDir = path.join(__dirname, "../src/lib/db/schema");
const docsDir = path.join(__dirname, "../docs");
const outFile = path.join(docsDir, "11_BuildIn_DB_Schema.md");

function getBaseCall(expr: CallExpression): CallExpression {
  let current: CallExpression = expr;
  while (Node.isPropertyAccessExpression(current.getExpression())) {
    const inner = current.getExpression().getExpression();
    if (Node.isCallExpression(inner)) current = inner;
    else break;
  }
  return current;
}

function parseTable(
  fileName: string,
  tableName: string,
  columnsObj: ObjectLiteralExpression
) {
  const columns: { property: string; column: string; type: string }[] = [];
  columnsObj.getProperties().forEach((prop) => {
    if (!Node.isPropertyAssignment(prop)) return;
    const propertyName = prop.getName();
    const init = prop.getInitializer();
    if (!init || !Node.isCallExpression(init)) return;
    const base = getBaseCall(init);
    const typeName = base.getExpression().getText();
    const colArg = base.getArguments()[0];
    let columnName: string;
    if (colArg && colArg.getKind() === SyntaxKind.StringLiteral) {
      columnName = colArg.getText().slice(1, -1);
    } else {
      columnName = propertyName;
    }
    columns.push({
      property: propertyName,
      column: columnName,
      type: typeName,
    });
  });

  docLines.push(`## ${tableName}`);
  docLines.push(`Defined in \`${fileName}\`.`);
  docLines.push("");
  docLines.push("| Property | Column | Type |");
  docLines.push("| --- | --- | --- |");
  columns.forEach((c) => {
    docLines.push(`| ${c.property} | ${c.column} | ${c.type} |`);
  });
  docLines.push("");
}

const docLines: string[] = [
  "# Database Schema",
  "",
  "This file is automatically generated. Do not edit manually.",
  "",
];

for (const file of fs.readdirSync(schemaDir)) {
  if (!file.endsWith(".ts")) continue;
  const filePath = path.join(schemaDir, file);
  const source = project.addSourceFileAtPath(filePath);
  source.getVariableStatements().forEach((stmt) => {
    if (!stmt.isExported()) return;
    stmt.getDeclarations().forEach((decl) => {
      const init = decl.getInitializer();
      if (!init || !Node.isCallExpression(init)) return;
      const base = getBaseCall(init);
      const exprName = base.getExpression().getText();
      if (exprName !== "pgBaseTable" && exprName !== "pgTable") return;
      const args = base.getArguments();
      if (args.length < 2) return;
      let tableName: string;
      if (args[0].getKind() === SyntaxKind.StringLiteral) {
        tableName = args[0].getText().slice(1, -1);
      } else {
        tableName = args[0].getText();
      }
      const columnsObj = args[1];
      if (!Node.isObjectLiteralExpression(columnsObj)) return;
      parseTable(file, tableName, columnsObj);
    });
  });
}

fs.writeFileSync(outFile, docLines.join("\n"));
console.log(`Documentation written to ${outFile}`);
