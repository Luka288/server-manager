import type { NextFunction, Request, RequestHandler, Response } from 'express';

type Handler = (req: Request, res: Response, next: NextFunction) => unknown;

/**
 * Forwards sync throws and rejected promises to Express' error middleware,
 * so route handlers don't need their own try/catch.
 */
export const asyncHandler =
  (handler: Handler): RequestHandler =>
  (req, res, next) => {
    Promise.resolve()
      .then(() => handler(req, res, next))
      .catch(next);
  };
