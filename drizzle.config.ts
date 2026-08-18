import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

dotenv.config();

const dbUrl = process.env.DATABASE_URL || "";
const isLocalDb =
  dbUrl.includes("localhost") ||
  dbUrl.includes("127.0.0.1") ||
  process.env.DB_SSL === "false";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: dbUrl,
    ssl: isLocalDb ? false : { rejectUnauthorized: false },
  },
});
