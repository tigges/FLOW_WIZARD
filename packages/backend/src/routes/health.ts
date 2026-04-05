import { Router, Request, Response } from "express";
import { EnvConfig } from "../config.js";

export function healthRoutes(config: EnvConfig): Router {
  const router = Router();

  router.get("/health", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      version: "0.1.0",
      environment: config.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  });

  router.get("/ready", (_req: Request, res: Response) => {
    res.json({ ready: true });
  });

  return router;
}
