#!/usr/bin/env node
const Ajv2020 = require("ajv/dist/2020");
const addFormats = require("ajv-formats");
const fs = require("fs");
const path = require("path");

const schemaDir = path.join(__dirname, "..", "docs", "api", "schemas");
const mocksDir = path.join(__dirname, "..", "docs", "api", "mocks");

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);

const schemaMap = {};
for (const f of fs.readdirSync(schemaDir).filter((f) => f.endsWith(".json"))) {
  const name = f.replace(".schema.json", "");
  const schema = JSON.parse(fs.readFileSync(path.join(schemaDir, f), "utf8"));
  schemaMap[name] = ajv.compile(schema);
}

const mockToSchema = {
  "01-session.created.response.json": "session",
  "09-session.with-files.response.json": "session",
  "04-settings.response.json": "settings",
  "06-preview-graph.response.json": "preview-graph",
  "08-artifact-manifest.response.json": "artifact-manifest",
  "10-ai-consent.state.response.json": "ai-usage-consent",
};

const pageToSchema = {
  "01-page-map.response.json": "page-map",
};

let passed = 0;
let failed = 0;
let skipped = 0;

function validateFile(filePath, schemaName) {
  const validate = schemaMap[schemaName];
  if (!validate) {
    console.log(`  ? ${path.basename(filePath)} — schema "${schemaName}" not compiled, skipping`);
    skipped++;
    return;
  }
  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (validate(data)) {
      console.log(`  ✓ ${path.basename(filePath)} → ${schemaName}`);
      passed++;
    } else {
      console.error(
        `  ✗ ${path.basename(filePath)} → ${schemaName}:`
      );
      for (const err of validate.errors) {
        console.error(`      ${err.instancePath || "/"} ${err.message}`);
      }
      failed++;
    }
  } catch (err) {
    console.error(`  ✗ ${path.basename(filePath)}: ${err.message}`);
    failed++;
  }
}

console.log("Validating response mocks against schemas...\n");

const responsesDir = path.join(mocksDir, "responses");
for (const [file, schema] of Object.entries(mockToSchema)) {
  validateFile(path.join(responsesDir, file), schema);
}

const pagesDir = path.join(responsesDir, "pages");
for (const [file, schema] of Object.entries(pageToSchema)) {
  validateFile(path.join(pagesDir, file), schema);
}

console.log(`\nResults: ${passed} passed, ${failed} failed, ${skipped} skipped`);
process.exit(failed > 0 ? 1 : 0);
