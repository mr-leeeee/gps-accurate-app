import { logger } from './logger';

const REQUIRED_VARS = [
  'VITE_API_TIMEOUT',
  'VITE_REVERSE_GEOCODE_TIMEOUT',
  'VITE_OSRM_TIMEOUT',
  'VITE_DEFAULT_LATITUDE',
  'VITE_DEFAULT_LONGITUDE',
] as const;

const OPTIONAL_VARS = [
  'VITE_APP_NAME',
  'VITE_APP_VERSION',
] as const;

export function validateEnv(): void {
  const missing: string[] = [];

  for (const key of REQUIRED_VARS) {
    if (!import.meta.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    logger.warn(`Missing env vars: ${missing.join(', ')}. Using defaults.`);
  }

  for (const key of OPTIONAL_VARS) {
    if (!import.meta.env[key]) {
      logger.debug(`Optional env var not set: ${key}`);
    }
  }
}

export function getEnvNumber(key: string, fallback: number): number {
  const value = import.meta.env[key];
  if (!value) return fallback;
  const parsed = Number(value);
  return isNaN(parsed) ? fallback : parsed;
}

export function getEnvString(key: string, fallback: string): string {
  return import.meta.env[key] || fallback;
}
