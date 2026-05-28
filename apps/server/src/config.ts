import "dotenv/config";

const DEFAULT_PORT = 3000;
const DEFAULT_ADMIN_PASSWORD = "dev-admin-password";

function parsePort(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_PORT;
}

export const PORT = parsePort(process.env.PORT);
export const HOST = "0.0.0.0";
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? DEFAULT_ADMIN_PASSWORD;
