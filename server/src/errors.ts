/** Typed application errors so route handlers stay small and messages stay friendly. */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code: string = 'app_error',
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const badRequest = (message: string): AppError =>
  new AppError(400, message, 'bad_request');

export const tooManyRequests = (message: string): AppError =>
  new AppError(429, message, 'rate_limited');

export const notConfigured = (message: string): AppError =>
  new AppError(503, message, 'not_configured');

export const serviceBusy = (message: string): AppError =>
  new AppError(503, message, 'service_busy');

export const timedOut = (message: string): AppError =>
  new AppError(504, message, 'timeout');

export const badGateway = (message: string): AppError =>
  new AppError(502, message, 'bad_gateway');
