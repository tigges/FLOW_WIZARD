import { Router, Request, Response } from "express";
import * as store from "../store/memory.js";

function param(req: Request, name: string): string {
  const v = req.params[name];
  return Array.isArray(v) ? v[0] : v;
}

export function jobRoutes(): Router {
  const router = Router();

  router.post(
    "/v1/import-wizard/sessions/:sessionId/preview-jobs",
    (req: Request, res: Response) => {
      const sessionId = param(req, "sessionId");
      const { cpmRevision, settingsRevision, moderation } = req.body;

      const session = store.getSession(sessionId);
      if (!session) {
        res.status(404).json({ error: "session_not_found" });
        return;
      }

      if (cpmRevision === undefined || settingsRevision === undefined) {
        res.status(400).json({ error: "cpmRevision and settingsRevision are required" });
        return;
      }

      const job = store.createJob(sessionId, "preview", moderation);
      res.status(202).json({
        jobId: job.jobId,
        type: job.type,
        state: job.state,
      });
    }
  );

  router.post(
    "/v1/import-wizard/sessions/:sessionId/compile-jobs",
    (req: Request, res: Response) => {
      const sessionId = param(req, "sessionId");
      const { cpmRevision, settingsRevision, mode, moderation } = req.body;

      const session = store.getSession(sessionId);
      if (!session) {
        res.status(404).json({ error: "session_not_found" });
        return;
      }

      if (cpmRevision === undefined || settingsRevision === undefined) {
        res.status(400).json({ error: "cpmRevision and settingsRevision are required" });
        return;
      }

      const job = store.createJob(sessionId, "compile", moderation);
      res.status(202).json({
        jobId: job.jobId,
        type: job.type,
        state: job.state,
      });
    }
  );

  router.get(
    "/v1/import-wizard/sessions/:sessionId/jobs/:jobId",
    (req: Request, res: Response) => {
      const job = store.getJob(param(req, "jobId"));
      if (!job) {
        res.status(404).json({ error: "job_not_found" });
        return;
      }
      res.json({
        jobId: job.jobId,
        type: job.type,
        state: job.state,
        ...(job.error ? { error: job.error } : {}),
      });
    }
  );

  return router;
}
