import { Pool } from "pg";

if (!process.env.DATABASE_PASSWORD) {
  console.warn("WARNING: DATABASE_PASSWORD env variable is not set");
}

const pool = new Pool({
  host: process.env.DATABASE_HOST || "localhost",
  port: parseInt(process.env.DATABASE_PORT || "5432"),
  database: process.env.DATABASE_NAME || "novamira",
  user: process.env.DATABASE_USER || "postgres",
  password: process.env.DATABASE_PASSWORD,
  max: parseInt(process.env.DATABASE_POOL_MAX || "10"),
});

export default pool;
