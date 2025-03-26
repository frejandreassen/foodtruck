/**
 * Environment variables for server-side code
 */
export const serverEnv = {
  // Server-side only environment variables
  DIRECTUS_URL: process.env.DIRECTUS_URL || 'https://cms.businessfalkenberg.se',
  APP_URL: process.env.APP_URL || 'http://localhost:3000',
}

/**
 * Environment variables for client-side code
 */
export const clientEnv = {
  // These should be exposed via NEXT_PUBLIC_* prefix
  DIRECTUS_URL: process.env.NEXT_PUBLIC_DIRECTUS_URL,
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
}