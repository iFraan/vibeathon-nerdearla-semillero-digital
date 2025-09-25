import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Create a connection pool
const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString, { 
  max: 20,
  idle_timeout: 20,
  connect_timeout: 10
});

// Create Drizzle instance with schema
export const db = drizzle(client, { schema });

// Export types
export type Database = typeof db;
export * from "./schema";

// Close database connection (useful for serverless)
export async function closeDatabase() {
  await client.end();
}
