import { Router, Request, Response } from "express";
import * as store from "../store/memory.js";

function param(req: Request, name: string): string {
  const v = req.params[name];
  return Array.isArray(v) ? v[0] : v;
}

export function cpmRoutes(): Router {
  const router = Router();

  router.get(
    "/v1/import-wizard/sessions/:sessionId/cpm",
    (req: Request, res: Response) => {
      const cpm = store.getCpm(param(req, "sessionId"));
      if (!cpm) {
        res.status(404).json({ error: "session_not_found" });
        return;
      }
      res.json(cpm.data);
    }
  );

  router.post(
    "/v1/import-wizard/sessions/:sessionId/cpm/patch",
    (req: Request, res: Response) => {
      const sessionId = param(req, "sessionId");
      const { baseRevision, operations } = req.body;

      if (baseRevision === undefined || !Array.isArray(operations) || operations.length === 0) {
        res.status(400).json({
          error: "invalid_request",
          message: "baseRevision (integer) and operations (non-empty array) are required",
        });
        return;
      }

      const result = store.patchCpm(sessionId, baseRevision, operations);
      if ("error" in result) {
        const status = result.error === "session_not_found" ? 404 : 409;
        res.status(status).json({ error: result.error });
        return;
      }

      res.json(result);
    }
  );

  return router;
}
