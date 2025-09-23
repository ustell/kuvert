import path from "node:path";
import dotenv from "dotenv";
import { z } from "zod";

// грузим корневой .env
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const Env = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(32),
  COOKIE_NAME: z.string().default("session"),
  COOKIE_MAX_DAYS: z.coerce.number().default(7),
});

export const env = Env.parse(process.env);
