import { Router, Request, Response } from "express";
import * as store from "../store/memory.js";

function param(req: Request, name: string): string {
  const v = req.params[name];
  return Array.isArray(v) ? v[0] : v;
}

export function sessionRoutes(): Router {
  const router = Router();

  router.post("/v1/import-wizard/sessions", (req: Request, res: Response) => {
    const session = store.createSession(req.body?.name);
    res.status(201).json(session);
  });

  router.get(
    "/v1/import-wizard/sessions/:sessionId",
    (req: Request, res: Response) => {
      const session = store.getSession(param(req, "sessionId"));
      if (!session) {
        res.status(404).json({ error: "session_not_found" });
        return;
      }
      res.json(session);
    }
  );

  router.post(
    "/v1/import-wizard/sessions/:sessionId/files",
    (req: Request, res: Response) => {
      const sessionId = param(req, "sessionId");
      const { displayName, mimeType, sizeBytes, content, kind } = req.body;

      if (!displayName) {
        res.status(400).json({ error: "displayName is required" });
        return;
      }

      const sourceType = kind === "reference" ? "reference" as const : "primary" as const;
      const size = sizeBytes || (content ? new TextEncoder().encode(content).length : 0);
      const mime = mimeType || "text/plain";

      const file = store.addFile(sessionId, displayName, mime, size, sourceType);
      if (!file) {
        res.status(404).json({ error: "session_not_found" });
        return;
      }

      res.status(201).json({
        fileId: file.fileId,
        checksum: file.sha256,
        status: file.uploadStatus,
      });
    }
  );

  return router;
}
