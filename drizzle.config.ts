import { defineConfig } from 'drizzle-kit'
import { loadEnvFile } from 'node:process'

try { loadEnvFile('.env.local') } catch { /* arquivo pode não existir em CI */ }

export default defineConfig({
  schema: './src/infrastructure/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  schemaFilter: ['stock'],
})
