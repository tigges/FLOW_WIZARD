import express from "express";
import cors from "cors";
import helmet from "helmet";
import { loadConfig } from "./config.js";
import { requestLogger, errorHandler } from "./middleware/common.js";
import { healthRoutes } from "./routes/health.js";
import { capabilitiesRoutes } from "./routes/capabilities.js";
import { sessionRoutes } from "./routes/sessions.js";
import { cpmRoutes } from "./routes/cpm.js";
import { aiRoutes } from "./routes/ai.js";
import { jobRoutes } from "./routes/jobs.js";

const config = loadConfig();
const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.use(healthRoutes(config));
app.use(capabilitiesRoutes());
app.use(sessionRoutes());
app.use(cpmRoutes());
app.use(aiRoutes());
app.use(jobRoutes());

app.use(errorHandler);

app.listen(config.PORT, () => {
  console.log(`[server] FLOW_WIZARD API running on port ${config.PORT}`);
  console.log(`[server] Environment: ${config.NODE_ENV}`);
  console.log(`[server] Health: http://localhost:${config.PORT}/health`);
});

export default app;
