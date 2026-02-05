import { Request, Response, NextFunction } from "express";

// Custom error class with status code
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Global error handling middleware
 * Should be registered last in middleware chain
 */
export function errorMiddleware(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error("Error occurred:", {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Default to 500 if no status code
  const statusCode = (err as AppError).statusCode || 500;
  const message = err.message || "Internal server error";

  // Send error response
  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
      path: req.path,
    }),
  });
}

/**
 * Async route handler wrapper to catch errors
 */
export function asyncHandler<T = any>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: any, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
