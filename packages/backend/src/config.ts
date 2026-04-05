export interface EnvConfig {
  PORT: number;
  NODE_ENV: string;
  SESSION_SIGNING_SECRET: string;
  GEMINI_API_KEY: string;
  COPILOT_TOKEN: string;
  APP_BASE_URL: string;
}

const required = (name: string): string => {
  const val = process.env[name];
  if (!val) {
    console.error(`[env] Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return val;
};

const optional = (name: string, fallback: string): string =>
  process.env[name] ?? fallback;

export function loadConfig(): EnvConfig {
  return {
    PORT: parseInt(optional("PORT", "3001"), 10),
    NODE_ENV: optional("NODE_ENV", "development"),
    SESSION_SIGNING_SECRET: required("SESSION_SIGNING_SECRET"),
    GEMINI_API_KEY: optional("GEMINI_API_KEY", ""),
    COPILOT_TOKEN: optional("COPILOT_TOKEN", ""),
    APP_BASE_URL: optional("APP_BASE_URL", "http://localhost:3001"),
  };
}
