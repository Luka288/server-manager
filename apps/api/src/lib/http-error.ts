/**
 * An error that knows which HTTP status it should be turned into.
 * Throw it from services/controllers; the global error handler renders it.
 */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }

  static badRequest(message: string) {
    return new HttpError(400, message);
  }

  static notFound(message = 'Server not found') {
    return new HttpError(404, message);
  }

  static conflict(message: string, code?: string) {
    return new HttpError(409, message, code);
  }
}
