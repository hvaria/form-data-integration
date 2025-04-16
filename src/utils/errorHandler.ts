import { EndpointName } from "../models/endpoint";

export enum ErrorCategory {
    VALIDATION = "VALIDATION",
    TRANSFORMATION = "TRANSFORMATION",
    API = "API",
    CONFIGURATION = "CONFIGURATION",
    DATABASE = "DATABASE",
    NETWORK = "NETWORK",
    UNKNOWN = "UNKNOWN"
}

export enum ErrorSeverity {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}

export interface ErrorContext {
    customerId?: string;
    endpoint?: string;
    retryCount?: number;
    payload?: any;
    message?: string;
    category?: ErrorCategory;
    severity?: ErrorSeverity;
    httpStatus?: number;
}

export class ProcessingError extends Error {
    public severity: ErrorSeverity;
    public category: ErrorCategory;

    constructor(
        public originalError: Error,
        public context: ErrorContext = {}
    ) {
        super(context.message || originalError.message);
        this.name = 'ProcessingError';
        this.severity = context.severity || ErrorSeverity.MEDIUM;
        this.category = context.category || ErrorCategory.UNKNOWN;
    }

    toJSON() {
        return {
            name: this.name,
            message: this.message,
            severity: this.severity,
            category: this.category,
            context: this.context,
            originalError: {
                message: this.originalError.message,
                stack: this.originalError.stack
            }
        };
    }
}

interface LogEntry {
    timestamp: string;
    level: 'info' | 'warn' | 'error';
    message: string;
    context?: Record<string, any>;
}

class Logger {
    private logs: LogEntry[] = [];
    private maxLogs: number = 1000;

    info(message: string, context?: Record<string, any>): void {
        this.addLog('info', message, context);
    }

    warn(message: string, context?: Record<string, any>): void {
        this.addLog('warn', message, context);
    }

    error(message: string, context?: Record<string, any>): void {
        this.addLog('error', message, context);
    }

    private addLog(level: LogEntry['level'], message: string, context?: Record<string, any>): void {
        const logEntry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            context
        };

        this.logs.push(logEntry);
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        // Also log to console in development
        if (process.env.NODE_ENV === 'development') {
            const logMessage = `[${logEntry.timestamp}] ${level.toUpperCase()}: ${message}`;
            if (context) {
                console[level](logMessage, context);
            } else {
                console[level](logMessage);
            }
        }
    }

    getLogs(level?: LogEntry['level']): LogEntry[] {
        return level
            ? this.logs.filter(log => log.level === level)
            : this.logs;
    }

    clearLogs(): void {
        this.logs = [];
    }
}

export const logger = new Logger();

export function logError(error: Error, context?: Record<string, any>): void {
    if (error instanceof ProcessingError) {
        logger.error(error.message, {
            ...context,
            ...error.toJSON()
        });
    } else {
        logger.error(error.message, {
            ...context,
            stack: error.stack
        });
    }
}

export function errorHandler(error: unknown): never {
    if (error instanceof ProcessingError) {
        logError(error);
        throw error;
    }

    const processingError = new ProcessingError(
        error instanceof Error ? error : new Error(String(error)),
        { 
            message: "Unexpected processing error",
            category: ErrorCategory.UNKNOWN,
            severity: ErrorSeverity.MEDIUM
        }
    );
    logError(processingError);
    throw processingError;
}

// Helper functions for creating specific error types
export function createValidationError(error: Error, context: ErrorContext = {}): ProcessingError {
    return new ProcessingError(error, {
        ...context,
        category: ErrorCategory.VALIDATION,
        severity: ErrorSeverity.MEDIUM
    });
}

export function createApiError(error: Error, context: ErrorContext = {}): ProcessingError {
    return new ProcessingError(error, {
        ...context,
        category: ErrorCategory.API,
        severity: ErrorSeverity.HIGH
    });
}

export function createConfigurationError(error: Error, context: ErrorContext = {}): ProcessingError {
    return new ProcessingError(error, {
        ...context,
        category: ErrorCategory.CONFIGURATION,
        severity: ErrorSeverity.CRITICAL
    });
}

export class ValidationError extends Error {
    constructor(
        public field: string,
        public message: string,
        public value: any
    ) {
        super(`Validation failed for field ${field}: ${message}`);
        this.name = 'ValidationError';
    }
}

export class TransformationError extends Error {
    constructor(
        public field: string,
        public message: string,
        public value: any
    ) {
        super(`Transformation failed for field ${field}: ${message}`);
        this.name = 'TransformationError';
    }
}

export class EndpointError extends Error {
    constructor(
        public endpoint: string,
        public status: number,
        public response: any
    ) {
        super(`Endpoint ${endpoint} returned status ${status}`);
        this.name = 'EndpointError';
    }
}