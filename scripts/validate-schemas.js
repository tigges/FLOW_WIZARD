#!/usr/bin/env node
const Ajv2020 = require("ajv/dist/2020");
const addFormats = require("ajv-formats");
const fs = require("fs");
const path = require("path");

const schemaDir = path.join(__dirname, "..", "docs", "api", "schemas");
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);

const files = fs.readdirSync(schemaDir).filter((f) => f.endsWith(".json"));
let exitCode = 0;

for (const file of files) {
  const filePath = path.join(schemaDir, file);
  try {
    const schema = JSON.parse(fs.readFileSync(filePath, "utf8"));
    ajv.compile(schema);
    console.log(`  ✓ ${file}`);
  } catch (err) {
    console.error(`  ✗ ${file}: ${err.message}`);
    exitCode = 1;
  }
}

if (exitCode === 0) {
  console.log(`\nAll ${files.length} schemas are valid.`);
} else {
  console.error("\nSome schemas failed validation.");
}
process.exit(exitCode);
