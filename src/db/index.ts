import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import dotenv from "dotenv";
import * as schema from "./schema.js";

dotenv.config();

const { Pool } = pg;

const dbUrl = process.env.DATABASE_URL || "";
const isLocalDb =
  dbUrl.includes("localhost") ||
  dbUrl.includes("127.0.0.1") ||
  process.env.DB_SSL === "false";

export const pool = new Pool({
  connectionString: dbUrl,
  ssl: isLocalDb ? false : { rejectUnauthorized: false },
});

export const db = drizzle({ client: pool });

export * from "./schema.js";
