// Centralized, typed access to environment variables.
// Import from "@/utils/env" instead of touching import.meta.env directly.
export const env = {
  appEnv: import.meta.env.VITE_APP_ENV,
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
} as const

export const isDevelopment = env.appEnv === 'development'
export const isStaging = env.appEnv === 'staging'
export const isProduction = env.appEnv === 'production'
