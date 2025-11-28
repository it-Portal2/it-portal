import { AIErrorType, ClassifiedError, AIKeyFromDB } from "./types";

/**
 * Custom Error Classes for Better Error Handling
 */

export class GeminiAPIError extends Error {
  public readonly type: AIErrorType;
  public readonly keyId: string;
  public readonly shouldRetry: boolean;

  constructor(
    type: AIErrorType,
    message: string,
    keyId: string = "unknown",
    shouldRetry: boolean = false,
    originalError?: Error
  ) {
    super(message);
    this.name = "GeminiAPIError";
    this.type = type;
    this.keyId = keyId;
    this.shouldRetry = shouldRetry;

    // Preserve stack trace
    if (originalError) {
      this.stack = originalError.stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class GeminiConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeminiConfigurationError";
    Error.captureStackTrace(this, this.constructor);
  }
}

export class GeminiValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeminiValidationError";
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Enhanced Error Classification and Handling
 * Provides detailed, actionable error messages for different failure scenarios
 */
export function classifyAndLogError(
  error: unknown,
  keyInfo: AIKeyFromDB,
  attemptIndex: number,
  rotation: number,
  duration: number,
  timeout: number
): ClassifiedError {
  const errorMsg =
    error instanceof Error
      ? error.message.toLowerCase()
      : String(error).toLowerCase();
  const originalError =
    error instanceof Error ? error : new Error(String(error));

  let errorType: AIErrorType = "unknown";
  let shouldRetryImmediately = false;
  let userMessage = "";
  let technicalMessage = "";

  // Timeout errors - retry immediately
  if (errorMsg.includes("timed out") || errorMsg.includes("timeout")) {
    errorType = "timeout";
    shouldRetryImmediately = true;
    userMessage = `Timeout after ${timeout}ms`;
    technicalMessage = `Key "${keyInfo.aiId}" (Priority ${keyInfo.priority}) timed out during rotation ${rotation}`;
  }
  // Authentication errors
  else if (
    errorMsg.includes("auth") ||
    errorMsg.includes("unauthorized") ||
    errorMsg.includes("invalid token") ||
    errorMsg.includes("api key") ||
    errorMsg.includes("403") ||
    errorMsg.includes("401")
  ) {
    errorType = "auth";
    shouldRetryImmediately = false;
    userMessage = "API key invalid";
    technicalMessage = `Authentication failed for key "${keyInfo.aiId}". Verify the API key is valid and properly configured.`;
  }
  // Quota/Rate limit errors
  else if (
    errorMsg.includes("quota") ||
    errorMsg.includes("rate limit") ||
    errorMsg.includes("too many requests") ||
    errorMsg.includes("429")
  ) {
    errorType = "quota";
    shouldRetryImmediately = false;
    userMessage = "Rate limit exceeded";
    technicalMessage = `Key "${keyInfo.aiId}" has reached its quota or rate limit. Consider rotating keys or increasing capacity.`;
  }
  // Network errors
  else if (
    errorMsg.includes("network") ||
    errorMsg.includes("connection") ||
    errorMsg.includes("fetch") ||
    errorMsg.includes("enotfound") ||
    errorMsg.includes("econnrefused") ||
    errorMsg.includes("econnreset")
  ) {
    errorType = "network";
    shouldRetryImmediately = false;
    userMessage = "Network error";
    technicalMessage = `Network error occurred while using key "${keyInfo.aiId}". Check connectivity and endpoint availability.`;
  }
  // JSON parsing errors
  else if (
    errorMsg.includes("json") ||
    errorMsg.includes("parse") ||
    errorMsg.includes("unexpected token") ||
    errorMsg.includes("syntax")
  ) {
    errorType = "parsing";
    shouldRetryImmediately = false;
    userMessage = "Response parsing failed";
    technicalMessage = `Failed to parse JSON response from key "${keyInfo.aiId}". The service may have returned an invalid or malformed response.`;
  }
  // Validation errors
  else if (
    errorMsg.includes("validation") ||
    errorMsg.includes("invalid format") ||
    errorMsg.includes("missing required") ||
    errorMsg.includes("bad request")
  ) {
    errorType = "validation";
    shouldRetryImmediately = false;
    userMessage = "Invalid request format";
    technicalMessage = `Request validation failed for key "${keyInfo.aiId}". Ensure the input format meets API requirements.`;
  }
  // Unknown errors
  else {
    errorType = "unknown";
    shouldRetryImmediately = false;
    userMessage = "Unexpected error occurred";
    technicalMessage = `Unknown error encountered with key "${
      keyInfo.aiId
    }": ${errorMsg.substring(0, 100)}`;
  }

  // Log with appropriate severity level
  const logLevel = errorType === "timeout" ? "warn" : "error";
  const logMessage = `[Attempt ${
    attemptIndex + 1
  }] ${technicalMessage} | Duration: ${duration}ms/${timeout}ms | Type: ${errorType.toUpperCase()}`;

  if (logLevel === "warn") {
    console.warn(logMessage);
  } else {
    console.error(logMessage);
  }

  return {
    type: errorType,
    shouldRetryImmediately,
    userMessage,
    technicalMessage,
    originalError,
  };
}

/**
 * Generate short, user-friendly error messages for toast notifications
 */
export function generateUserFriendlyErrorMessage(
  attemptResults: Array<{
    errorType: AIErrorType;
    userMessage: string;
  }>,
  totalKeys: number,
  totalTime: number
): string {
  if (attemptResults.length === 0) {
    return "No API attempts made. Check system configuration.";
  }

  const errorSummary = attemptResults.reduce((acc, result) => {
    acc[result.errorType] = (acc[result.errorType] || 0) + 1;
    return acc;
  }, {} as Record<AIErrorType, number>);

  const totalAttempts = attemptResults.length;
  const [dominantErrorType] = Object.entries(errorSummary).sort(
    ([, a], [, b]) => b - a
  )[0];

  switch (dominantErrorType as AIErrorType) {
    case "auth":
      return `All ${totalKeys} API keys failed authentication. Check keys in Admin Panel.`;

    case "quota":
      return `All ${totalKeys} API keys hit rate limits. Wait 5-10 minutes or add more keys.`;

    case "timeout":
      return `All attempts timed out (${totalTime}ms). AI service overloaded. Try again in 1 minute.`;

    case "network":
      return "Network connection failed. Check internet connectivity and retry.";

    case "parsing":
      return "AI response parsing failed. This is usually temporary - retry now.";

    case "validation":
      return "Request validation failed. Check input data format.";

    default:
      const errorList = Object.entries(errorSummary)
        .map(([type, count]) => `${type}(${count})`)
        .join(", ");

      return `${totalAttempts} attempts failed: ${errorList}. Check API configuration.`;
  }
}

/**
 * Database/Configuration specific short error messages
 */
export function getDatabaseErrorMessage(error: Error): string {
  const errorMsg = error.message.toLowerCase();

  if (
    errorMsg.includes("no ai keys found") ||
    errorMsg.includes("database_error")
  ) {
    return "No AI keys configured. Add Google API keys in Admin Panel → Settings → Manage AI Keys.";
  }

  if (errorMsg.includes("no active") || errorMsg.includes("config_error")) {
    return "No active AI keys found. Activate keys in Admin Panel → Settings → Manage AI Keys.";
  }

  if (errorMsg.includes("strategy_error")) {
    return "Retry strategy failed due to time constraints. Check service configuration.";
  }

  return `System error: ${error.message}. Contact support if this persists.`;
}
