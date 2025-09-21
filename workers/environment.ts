import { Env } from './types';
import { getWorkerFrontendUrl } from './utils/domainConfig';

export function getEnvironment(env: Env): string {
  return env.ENVIRONMENT || 'production';
}

export function isLocalEnvironment(env: Env): boolean {
  return getEnvironment(env) === 'local';
}

export function isStagingEnvironment(env: Env): boolean {
  return getEnvironment(env) === 'staging';
}

export function isProductionEnvironment(env: Env): boolean {
  return getEnvironment(env) === 'production';
}

export function isDevelopmentEnvironment(env: Env): boolean {
  return isLocalEnvironment(env) || isStagingEnvironment(env);
}

export function requireConfirmationForDestructiveAction(env: Env, action: string): boolean {
  if (isDevelopmentEnvironment(env)) {
    console.warn(`⚠️  DEVELOPMENT ENVIRONMENT: Performing destructive action: ${action}`);
    return false;
  }
  return false;
}

export function logEnvironmentInfo(env: Env): void {
  const environment = getEnvironment(env);
  const appUrl = getWorkerFrontendUrl(env);

  console.log(`🌍 Environment: ${environment}`);
  console.log(`🔗 App URL: ${appUrl}`);

  if (isDevelopmentEnvironment(env)) {
    console.log(`🛠️  Development mode: Enhanced logging and safeguards enabled`);
  }
}

export function getEnvironmentSpecificSettings(env: Env) {
  const environment = getEnvironment(env);
  
  return {
    environment,
    enableDebugLogging: isDevelopmentEnvironment(env),
    enableDetailedErrors: isDevelopmentEnvironment(env),
    requireEmailVerification: isProductionEnvironment(env),
    allowTestData: isDevelopmentEnvironment(env),
    maxBooksPerUser: isLocalEnvironment(env) ? 1000 : 500,
    maxLocationsPerUser: isLocalEnvironment(env) ? 50 : 10,
  };
}