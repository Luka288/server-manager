import type { ErrorRequestHandler } from 'express';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (
    err &&
    typeof err === 'object' &&
    typeof err.status === 'number' &&
    typeof err.message === 'string'
  ) {
    res.status(err.status).json({
      error: err.message,
      ...(err.code ? { code: err.code } : {}),
    });
    return;
  }

  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
};
