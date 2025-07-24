import { databaseMonitor } from "./database-monitor";

let isInitialized = false;

export function initializeApp() {
  if (isInitialized) {
    console.log('[APP INIT] Application already initialized');
    return;
  }

  console.log('[APP INIT] Initializing SQL Backup Pilot...');

  try {
    // Start database monitoring with 10-minute intervals to avoid overwhelming database connections
    databaseMonitor.start(10);
    console.log('[APP INIT] Database monitoring started');

    isInitialized = true;
    console.log('[APP INIT] Application initialization complete');
  } catch (error) {
    console.error('[APP INIT] Failed to initialize application:', error);
  }
}

export function shutdownApp() {
  if (!isInitialized) {
    return;
  }

  console.log('[APP INIT] Shutting down application...');
  
  try {
    databaseMonitor.stop();
    console.log('[APP INIT] Database monitoring stopped');
    
    isInitialized = false;
    console.log('[APP INIT] Application shutdown complete');
  } catch (error) {
    console.error('[APP INIT] Error during shutdown:', error);
  }
} 