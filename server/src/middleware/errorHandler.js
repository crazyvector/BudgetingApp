/**
 * Global error handling middleware for Express.
 * Catches all errors thrown in route handlers and returns
 * a consistent JSON error response.
 */
export function errorHandler(err, req, res, _next) {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

  // Prisma known request errors (e.g., unique constraint, not found)
  if (err.code === "P2002") {
    return res.status(409).json({
      error: "Conflict",
      message: `A record with that ${err.meta?.target?.join(", ") || "value"} already exists.`,
    });
  }

  if (err.code === "P2025") {
    return res.status(404).json({
      error: "Not Found",
      message: "The requested record does not exist.",
    });
  }

  // Zod validation errors (caught by validate middleware, but just in case)
  if (err.name === "ZodError") {
    return res.status(400).json({
      error: "Validation Error",
      message: "Invalid request data.",
      details: err.errors,
    });
  }

  // Default server error
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: status === 500 ? "Internal Server Error" : err.message,
    message: err.message || "Something went wrong.",
  });
}
