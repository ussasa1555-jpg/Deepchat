/**
 * Error Monitoring & Logging
 * For production: integrate with Sentry
 */

export interface ErrorLog {
  message: string;
  stack?: string;
  context?: any;
  userId?: string;
  timestamp: string;
}

class ErrorMonitor {
  private logs: ErrorLog[] = [];
  private maxLogs = 100;

  logError(error: Error | string, context?: any, userId?: string) {
    const errorLog: ErrorLog = {
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      context,
      userId,
      timestamp: new Date().toISOString(),
    };

    this.logs.push(errorLog);
    
    // Keep only last 100 logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[ERROR_MONITOR]', errorLog);
    }

    // TODO: Send to Sentry in production
    // if (process.env.NODE_ENV === 'production') {
    //   Sentry.captureException(error, { contexts: { custom: context } });
    // }
  }

  getRecentErrors(count = 10): ErrorLog[] {
    return this.logs.slice(-count);
  }

  clearLogs() {
    this.logs = [];
  }
}

export const errorMonitor = new ErrorMonitor();

// Global error handler
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    errorMonitor.logError(event.error || event.message, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    errorMonitor.logError(`Unhandled Promise Rejection: ${event.reason}`);
  });
}








