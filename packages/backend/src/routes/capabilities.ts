import { Router, Request, Response } from "express";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

let providerCapabilities: object;
try {
  const mockPath = join(__dirname, "..", "..", "..", "docs", "api", "mocks", "responses", "11-provider-capabilities.response.json");
  providerCapabilities = JSON.parse(readFileSync(mockPath, "utf-8"));
} catch {
  providerCapabilities = {
    version: "2026-04-05.1",
    providers: [
      { provider: "gemini", enabled: true, modelFamilies: ["gemini-2.5-flash", "gemini-2.5-pro"], notes: "Default provider." },
      { provider: "copilot", enabled: true, modelFamilies: ["copilot-chat-compatible"], notes: "Optional fallback." },
      { provider: "internal", enabled: true, modelFamilies: ["deterministic-rules-engine"], notes: "Zero-cost deterministic fallback." },
    ],
  };
}

export function capabilitiesRoutes(): Router {
  const router = Router();

  router.get(
    "/v1/import-wizard/capabilities/providers",
    (_req: Request, res: Response) => {
      res.json(providerCapabilities);
    }
  );

  return router;
}
