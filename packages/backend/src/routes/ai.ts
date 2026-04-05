import { Router, Request, Response } from "express";
import * as store from "../store/memory.js";

function param(req: Request, name: string): string {
  const v = req.params[name];
  return Array.isArray(v) ? v[0] : v;
}

export function aiRoutes(): Router {
  const router = Router();

  router.post(
    "/v1/import-wizard/sessions/:sessionId/ai/estimate",
    (req: Request, res: Response) => {
      const sessionId = param(req, "sessionId");
      const { action, providerPolicy } = req.body;

      if (!action) {
        res.status(400).json({ error: "action_required" });
        return;
      }

      const session = store.getSession(sessionId);
      if (!session) {
        res.status(404).json({ error: "session_not_found" });
        return;
      }

      const validActions = ["extract", "patch-assist", "preview", "visual-qa", "compile", "export"];
      if (!validActions.includes(action)) {
        res.status(400).json({ error: "invalid_action", validActions });
        return;
      }

      const estimate = store.createEstimate(sessionId, action, providerPolicy);
      res.json(estimate);
    }
  );

  router.post(
    "/v1/import-wizard/sessions/:sessionId/ai/confirm",
    (req: Request, res: Response) => {
      const { estimateId, action, userConfirmation } = req.body;

      if (!estimateId || !action || !userConfirmation) {
        res.status(400).json({ error: "missing_fields" });
        return;
      }

      if (!userConfirmation.confirmed || !userConfirmation.confirmedAt || !userConfirmation.actorType) {
        res.status(400).json({ error: "invalid_confirmation" });
        return;
      }

      const estimate = store.confirmEstimate(estimateId);
      if (!estimate) {
        res.status(412).json({
          error: "consent_required",
          code: "consent_required",
          message: "Estimate not found or expired. Request a new estimate.",
        });
        return;
      }

      if (estimate.action !== action) {
        res.status(400).json({ error: "action_mismatch" });
        return;
      }

      res.status(202).json({
        accepted: true,
        action: estimate.action,
        executionId: `exec_${estimate.estimateId.slice(4)}`,
      });
    }
  );

  return router;
}
