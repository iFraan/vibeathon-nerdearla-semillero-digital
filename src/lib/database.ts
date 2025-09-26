import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/lib/db/schema';

// Database connection
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

// For development, use connection pooling
const client = postgres(connectionString, { 
  max: process.env.NODE_ENV === 'production' ? 10 : 1,
  idle_timeout: 20,
  max_lifetime: 60 * 30
});

export const db = drizzle(client, { schema, logger: true });

export default db;

// Health check function
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await client`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Graceful shutdown
export async function closeDatabaseConnection(): Promise<void> {
  await client.end();
}
